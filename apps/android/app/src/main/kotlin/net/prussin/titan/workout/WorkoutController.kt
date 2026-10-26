package net.prussin.titan.workout

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import net.prussin.titan.core.api.ReadinessBody
import net.prussin.titan.core.store.JsonStore
import net.prussin.titan.core.sync.Outbox
import net.prussin.titan.core.sync.OutboxOp
import net.prussin.titan.core.sync.SyncReport
import net.prussin.titan.core.wire.WorkoutData
import net.prussin.titan.core.workout.Step
import net.prussin.titan.core.workout.WorkoutRun
import net.prussin.titan.data.Repository
import net.prussin.titan.data.SyncCoordinator
import java.time.Instant
import java.util.UUID

/** The pre-workout check-in (`ReadinessCheckIn`). */
data class Readiness(
    val energy: Int = 3,
    val soreness: Int = 3,
    val sleepQuality: Int = 3,
    val availableMinutes: Int = 60,
)

/**
 * Owns the workout underway on this phone: every change lands in local state
 * first, is persisted, and queues its server save — so logging never waits on
 * the network, and the notification and screen read the same state.
 */
class WorkoutController(
    private val context: Context,
    private val store: JsonStore<WorkoutRun>,
    private val outbox: Outbox,
    private val repository: Repository,
    private val scope: CoroutineScope,
) {
    lateinit var sync: SyncCoordinator

    private val _run = MutableStateFlow<WorkoutRun?>(null)
    val run: StateFlow<WorkoutRun?> = _run.asStateFlow()

    private val _conflict = MutableStateFlow<String?>(null)

    /** A session the server closed while this phone still had it open. */
    val conflict: StateFlow<String?> = _conflict.asStateFlow()

    /** Phone-minted ids the server answered with its own. */
    private val renamed = mutableMapOf<String, String>()

    /** The id a session goes by now, following any adoption. */
    fun resolve(sessionId: String): String = renamed[sessionId] ?: sessionId

    private val _finished = MutableSharedFlow<String>(extraBufferCapacity = 1)

    /** Sessions just finished here, for the screen to show their summary. */
    val finished: SharedFlow<String> = _finished.asSharedFlow()

    suspend fun restore() {
        _run.value = store.read()
        if (_run.value != null) WorkoutService.start(context)
    }

    /** A change that owes the server nothing (fields, timers). */
    fun update(transform: (WorkoutRun) -> WorkoutRun) {
        val current = _run.value ?: return
        set(transform(current))
    }

    /** A change that does: its saves are queued, then sent. */
    fun apply(transition: (WorkoutRun) -> Step) {
        val current = _run.value ?: return
        val step = transition(current)
        val ops = step.saves.map(OutboxOp::of)
        if (step.run.isFinished) {
            set(null)
            _finished.tryEmit(step.run.sessionId)
        } else {
            set(step.run)
        }
        queue(ops)
    }

    /**
     * Start a session: queue the readiness check-in and the start, then try to
     * reach the server. Online, the server's session is the source of truth;
     * offline, the cached plan supplies the day's prescriptions. Returns the
     * session id, or null when neither is available.
     */
    suspend fun start(
        date: String,
        alternativeId: String?,
        readiness: Readiness?,
    ): String? {
        val id = UUID.randomUUID().toString()
        val startedAt = Instant.now()
        val ops =
            listOfNotNull(
                readiness?.let {
                    OutboxOp.Readiness(
                        ReadinessBody(
                            UUID.randomUUID().toString(),
                            date,
                            it.energy,
                            it.soreness,
                            it.sleepQuality,
                            it.availableMinutes,
                        ),
                    )
                },
                OutboxOp.Start(id, startedAt.toString(), date, alternativeId),
            )
        outbox.append(ops)
        val report = sync.syncNow()
        val sessionId = report.adopted[id] ?: id
        val started =
            (if (report.drained) fromServer(sessionId) else null)
                ?: fromPlan(sessionId, date, alternativeId, startedAt.toEpochMilli())
        return if (started == null) {
            outbox.dropSession(sessionId)
            null
        } else {
            set(started)
            sessionId
        }
    }

    /** Make [sessionId] the run underway, loading it from the server if needed. */
    suspend fun open(sessionId: String): Boolean {
        if (_run.value?.sessionId == sessionId) return true
        val loaded = fromServer(sessionId) ?: return false
        if (loaded.isFinished) return false
        set(loaded)
        return true
    }

    fun cancel() {
        val current = _run.value ?: return
        set(null)
        queue(listOf(OutboxOp.Cancel(current.sessionId)))
    }

    /** The conflict prompt was acknowledged: the phone's copy is discarded. */
    fun dismissConflict() {
        if (_run.value?.sessionId == _conflict.value) set(null)
        _conflict.value = null
    }

    suspend fun onReport(report: SyncReport) {
        renamed.putAll(report.adopted)
        _run.value?.let { current ->
            report.adopted[current.sessionId]?.let { set(current.copy(sessionId = it)) }
        }
        _run.value?.let { current ->
            if (current.sessionId in report.conflicts) _conflict.value = current.sessionId
        }
        if (report.drained) repository.invalidate()
    }

    private fun set(next: WorkoutRun?) {
        val had = _run.value != null
        _run.value = next
        scope.launch { store.write(next) }
        if (next != null && !had) WorkoutService.start(context)
    }

    private fun queue(ops: List<OutboxOp>) {
        if (ops.isEmpty()) return
        scope.launch {
            outbox.append(ops)
            sync.syncNow()
        }
    }

    private suspend fun fromServer(sessionId: String): WorkoutRun? {
        val data =
            repository.fetch("workout:$sessionId", WorkoutData.serializer()) { workout(sessionId) } ?: return null
        val session = data.session
        return WorkoutRun.resume(
            sessionId = session.id,
            scheduledDate = session.scheduledDate,
            startedAtMs =
                session.startedAt?.let { runCatching { Instant.parse(it).toEpochMilli() }.getOrNull() }
                    ?: System.currentTimeMillis(),
            prescribed = session.prescribedExercises,
            results = session.results,
            inProgress = session.inProgress,
            exerciseNames = data.exerciseNames,
            modalities = data.exerciseModalities,
            explanations = data.explanations,
            concept2Connected = data.concept2Connected,
        )
    }

    private suspend fun fromPlan(
        sessionId: String,
        date: String,
        alternativeId: String?,
        startedAtMs: Long,
    ): WorkoutRun? {
        val plan = repository.plan() ?: return null
        val day = plan.days.firstOrNull { it.date == date } ?: return null
        val option = day.options.firstOrNull { it.alternativeId == alternativeId } ?: day.options.firstOrNull()
        return option?.let {
            WorkoutRun(
                sessionId = sessionId,
                scheduledDate = date,
                startedAtMs = startedAtMs,
                prescribed = it.prescribedExercises,
                exerciseNames = plan.exerciseNames,
                modalities = plan.exerciseModalities,
                explanations = it.explanations,
                concept2Connected = plan.concept2Connected,
            )
        }
    }
}
