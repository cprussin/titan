package net.prussin.titan.core.sync

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import net.prussin.titan.core.api.HttpException
import net.prussin.titan.core.api.ProgressBody
import net.prussin.titan.core.api.ReadinessBody
import net.prussin.titan.core.api.StartWorkoutBody
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.core.api.WeighInBody
import net.prussin.titan.core.store.JsonStore
import net.prussin.titan.core.workout.WorkoutSave
import java.io.IOException

/** A mutation made on the phone, waiting for the server. */
@Serializable
sealed interface OutboxOp {
    /** The workout session this op belongs to, if any — a 409 pauses only that session's ops. */
    val sessionId: String?

    @Serializable
    @SerialName("start")
    data class Start(
        override val sessionId: String,
        val startedAt: String,
        val date: String,
        val alternativeId: String? = null,
    ) : OutboxOp

    @Serializable
    @SerialName("progress")
    data class Progress(
        override val sessionId: String,
        val body: ProgressBody,
    ) : OutboxOp

    @Serializable
    @SerialName("cancel")
    data class Cancel(
        override val sessionId: String,
    ) : OutboxOp

    @Serializable
    @SerialName("weigh-in")
    data class WeighIn(
        val body: WeighInBody,
    ) : OutboxOp {
        override val sessionId: String? get() = null
    }

    @Serializable
    @SerialName("readiness")
    data class Readiness(
        val body: ReadinessBody,
    ) : OutboxOp {
        override val sessionId: String? get() = null
    }

    fun withSession(id: String): OutboxOp =
        when (this) {
            is Start -> copy(sessionId = id)
            is Progress -> copy(sessionId = id)
            is Cancel -> copy(sessionId = id)
            is WeighIn, is Readiness -> this
        }

    companion object {
        fun of(save: WorkoutSave): OutboxOp =
            when (save) {
                is WorkoutSave.Sets -> Progress(save.sessionId, ProgressBody.Sets(save.inProgress))
                is WorkoutSave.Recorded -> Progress(save.sessionId, ProgressBody.Recorded(save.result))
                is WorkoutSave.Finished -> Progress(save.sessionId, ProgressBody.Finished(save.result))
            }
    }
}

/** What a drain found that the app must act on. */
data class SyncReport(
    /** Sessions the server closed to further progress; their queued ops were dropped. */
    val conflicts: Set<String> = emptySet(),
    /** Phone-minted session ids the server answered with an existing session's id. */
    val adopted: Map<String, String> = emptyMap(),
    /** Everything queued reached the server. */
    val drained: Boolean = false,
    /** The token was refused; sign in again. */
    val unauthorized: Boolean = false,
)

/** The persisted, ordered queue of [OutboxOp]s. */
class Outbox(
    private val store: JsonStore<List<OutboxOp>>,
) {
    suspend fun all(): List<OutboxOp> = store.read().orEmpty()

    suspend fun append(ops: List<OutboxOp>) {
        if (ops.isNotEmpty()) store.update { it.orEmpty() + ops }
    }

    /** Drop the head if it is still [op] (it was delivered or is undeliverable). */
    suspend fun remove(op: OutboxOp) {
        store.update { queued -> queued.orEmpty().let { if (it.firstOrNull() == op) it.drop(1) else it - op } }
    }

    suspend fun dropSession(sessionId: String) {
        store.update { queued -> queued.orEmpty().filterNot { it.sessionId == sessionId } }
    }

    suspend fun renameSession(
        from: String,
        to: String,
    ) {
        store.update { queued -> queued.orEmpty().map { if (it.sessionId == from) it.withSession(to) else it } }
    }

    suspend fun hasPending(sessionId: String): Boolean = all().any { it.sessionId == sessionId }

    companion object {
        val serializer = ListSerializer(OutboxOp.serializer())
    }
}

/**
 * Replays the outbox in order. Stops at the first unreachable server (to retry
 * later); a 409 drops that session's ops and reports the conflict; any other
 * refusal drops the one op so a malformed entry can never wedge the queue.
 */
class SyncEngine(
    private val api: TitanApi,
    private val outbox: Outbox,
) {
    suspend fun drain(): SyncReport {
        val conflicts = mutableSetOf<String>()
        val adopted = mutableMapOf<String, String>()
        while (true) {
            val op = outbox.all().firstOrNull() ?: return SyncReport(conflicts, adopted, drained = true)
            try {
                val serverId = deliver(op)
                outbox.remove(op)
                if (op is OutboxOp.Start && serverId != op.sessionId) {
                    outbox.renameSession(op.sessionId, serverId)
                    adopted[op.sessionId] = serverId
                }
            } catch (_: IOException) {
                return SyncReport(conflicts, adopted)
            } catch (error: HttpException) {
                when {
                    error.isUnauthorized -> {
                        return SyncReport(conflicts, adopted, unauthorized = true)
                    }

                    error.code >= 500 -> {
                        return SyncReport(conflicts, adopted)
                    }

                    error.isConflict && op.sessionId != null -> {
                        outbox.dropSession(op.sessionId!!)
                        conflicts += op.sessionId!!
                    }

                    else -> {
                        outbox.remove(op)
                    }
                }
            }
        }
    }

    /** Sends one op; returns the session id the server used, for starts. */
    private suspend fun deliver(op: OutboxOp): String =
        when (op) {
            is OutboxOp.Start -> {
                api.startWorkout(StartWorkoutBody(op.sessionId, op.startedAt, op.alternativeId, op.date)).id
            }

            is OutboxOp.Progress -> {
                api.saveProgress(op.sessionId, op.body)
                op.sessionId
            }

            is OutboxOp.Cancel -> {
                api.cancelWorkout(op.sessionId)
                op.sessionId
            }

            is OutboxOp.WeighIn -> {
                api.weighIn(op.body)
                ""
            }

            is OutboxOp.Readiness -> {
                api.readiness(op.body)
                ""
            }
        }
}
