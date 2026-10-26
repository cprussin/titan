package net.prussin.titan.core.api

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonClassDiscriminator
import kotlinx.serialization.serializer
import net.prussin.titan.core.wire.BlockView
import net.prussin.titan.core.wire.BodyMetricsData
import net.prussin.titan.core.wire.CompleteData
import net.prussin.titan.core.wire.Concept2Match
import net.prussin.titan.core.wire.DashboardData
import net.prussin.titan.core.wire.ExerciseResult
import net.prussin.titan.core.wire.HistoryData
import net.prussin.titan.core.wire.IdResponse
import net.prussin.titan.core.wire.InProgressExercise
import net.prussin.titan.core.wire.OfflinePlan
import net.prussin.titan.core.wire.ProgramsData
import net.prussin.titan.core.wire.SessionResponse
import net.prussin.titan.core.wire.SettingsData
import net.prussin.titan.core.wire.TokenResponse
import net.prussin.titan.core.wire.WeekResponse
import net.prussin.titan.core.wire.WireJson
import net.prussin.titan.core.wire.WorkoutActionResponse
import net.prussin.titan.core.wire.WorkoutData
import java.net.URLEncoder

/** A response the server answered with an error status. */
class HttpException(
    val code: Int,
    message: String,
) : Exception(message) {
    val isConflict: Boolean get() = code == 409
    val isUnauthorized: Boolean get() = code == 401
    val isNotFound: Boolean get() = code == 404
}

@Serializable
data class StartWorkoutBody(
    val id: String? = null,
    val startedAt: String? = null,
    val alternativeId: String? = null,
    val date: String? = null,
)

@Serializable
data class WeighInBody(
    val id: String,
    val date: String,
    val weightLb: Double,
)

@Serializable
data class ReadinessBody(
    val id: String,
    val date: String,
    val energy: Int,
    val soreness: Int,
    val sleepQuality: Int,
    val availableMinutes: Int,
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface ProgressBody {
    @Serializable
    @SerialName("sets")
    data class Sets(
        val inProgress: InProgressExercise,
    ) : ProgressBody

    @Serializable
    @SerialName("recorded")
    data class Recorded(
        val recorded: ExerciseResult,
    ) : ProgressBody

    @Serializable
    @SerialName("finished")
    data class Finished(
        val recorded: ExerciseResult,
    ) : ProgressBody
}

@Serializable
private data class TokenBody(
    val handoff: String,
    val verifier: String,
)

@Serializable
private data class ActiveProgramBody(
    val blockId: String,
    val versionId: String,
)

@Serializable
private data class Concept2MatchBody(
    val slotId: String,
)

@Serializable
data class Concept2SyncResponse(
    val imported: Int = 0,
)

/** Every `/api/v1` call the app makes. */
class TitanApi(
    private val transport: HttpTransport,
) {
    suspend fun session(): SessionResponse = get("/api/v1/session")

    suspend fun dashboard(
        date: String? = null,
        week: Int? = null,
    ): DashboardData = get("/api/v1/dashboard" + query("date" to date, "week" to week?.toString()))

    suspend fun week(offset: Int): WeekResponse = get("/api/v1/week" + query("offset" to offset.toString()))

    suspend fun plan(days: Int): OfflinePlan = get("/api/v1/plan" + query("days" to days.toString()))

    suspend fun workout(id: String): WorkoutData = get("/api/v1/workouts/${encode(id)}")

    suspend fun complete(id: String): CompleteData = get("/api/v1/workouts/${encode(id)}/complete")

    suspend fun workoutAction(): WorkoutActionResponse = get("/api/v1/workout-action")

    suspend fun history(): HistoryData = get("/api/v1/history")

    suspend fun bodyMetrics(): BodyMetricsData = get("/api/v1/body-metrics")

    suspend fun programs(): ProgramsData = get("/api/v1/programs")

    suspend fun block(
        versionId: String,
        blockId: String,
    ): BlockView = get("/api/v1/programs/${encode(versionId)}/blocks/${encode(blockId)}")

    suspend fun settings(): SettingsData = get("/api/v1/settings")

    suspend fun startWorkout(body: StartWorkoutBody): IdResponse = send("POST", "/api/v1/workouts", body)

    suspend fun saveProgress(
        sessionId: String,
        body: ProgressBody,
    ) {
        send<ProgressBody, Unit>("PATCH", "/api/v1/workouts/${encode(sessionId)}", body)
    }

    suspend fun cancelWorkout(sessionId: String) {
        call("DELETE", "/api/v1/workouts/${encode(sessionId)}", null)
    }

    suspend fun weighIn(body: WeighInBody) {
        send<WeighInBody, Unit>("POST", "/api/v1/body-metrics", body)
    }

    suspend fun readiness(body: ReadinessBody) {
        send<ReadinessBody, Unit>("POST", "/api/v1/readiness", body)
    }

    suspend fun deleteWorkout(id: String) {
        call("DELETE", "/api/v1/history/workouts/${encode(id)}", null)
    }

    suspend fun deleteBodyMetric(id: String) {
        call("DELETE", "/api/v1/history/body-metrics/${encode(id)}", null)
    }

    suspend fun deleteHistory() {
        call("DELETE", "/api/v1/history", null)
    }

    suspend fun setActiveBlock(
        versionId: String,
        blockId: String,
    ) {
        send<ActiveProgramBody, Unit>("POST", "/api/v1/active-program", ActiveProgramBody(blockId, versionId))
    }

    suspend fun concept2Match(
        sessionId: String,
        slotId: String,
    ): Concept2Match = send("POST", "/api/v1/workouts/${encode(sessionId)}/concept2-match", Concept2MatchBody(slotId))

    suspend fun concept2Sync(): Concept2SyncResponse = send("POST", "/api/v1/concept2/sync", null as String?)

    suspend fun redeemHandoff(
        handoff: String,
        verifier: String,
    ): TokenResponse = send("POST", "/api/v1/auth/app/token", TokenBody(handoff, verifier))

    private suspend inline fun <reified T> get(path: String): T = decode(serializer(), call("GET", path, null))

    private suspend inline fun <reified B, reified T> send(
        method: String,
        path: String,
        body: B?,
    ): T {
        val text = call(method, path, body?.let { WireJson.encodeToString(serializer<B>(), it) } ?: "{}")
        return if (T::class == Unit::class) Unit as T else decode(serializer(), text)
    }

    private fun <T> decode(
        serializer: KSerializer<T>,
        text: String,
    ): T = WireJson.decodeFromString(serializer, text)

    private suspend fun call(
        method: String,
        path: String,
        body: String?,
    ): String {
        val response = transport.execute(HttpRequest(method, path, body))
        return if (response.code in 200..299) {
            response.body
        } else {
            throw HttpException(response.code, "$method $path → ${response.code}")
        }
    }

    companion object {
        /** Where a browser begins app sign-in. */
        fun signInUrl(
            baseUrl: String,
            challenge: String,
        ): String = baseUrl.trimEnd('/') + "/api/v1/auth/app/start" + query("challenge" to challenge)

        private fun query(vararg params: Pair<String, String?>): String {
            val present = params.filter { it.second != null }
            return if (present.isEmpty()) {
                ""
            } else {
                "?" +
                    present.joinToString("&") { "${it.first}=${encode(it.second!!)}" }
            }
        }

        private fun encode(value: String): String = URLEncoder.encode(value, Charsets.UTF_8)
    }
}
