package net.prussin.titan.core.wire

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonClassDiscriminator

// The `/api/v1` view models — what each web page renders, as JSON.

@Serializable
data class AlternativeChoice(
    val id: String,
    val label: String,
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface WorkoutAction {
    @Serializable
    @SerialName("start")
    data class Start(
        val alternatives: List<AlternativeChoice>,
    ) : WorkoutAction

    @Serializable
    @SerialName("continue")
    data class Continue(
        val sessionId: String,
    ) : WorkoutAction

    @Serializable
    @SerialName("done")
    data object Done : WorkoutAction
}

@Serializable
data class WorkoutActionResponse(
    val action: WorkoutAction? = null,
    val today: String,
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface DashboardPrimary {
    @Serializable
    @SerialName("start-workout")
    data class StartWorkout(
        val action: WorkoutAction,
    ) : DashboardPrimary

    @Serializable
    @SerialName("fill-workout")
    data class FillWorkout(
        val alternatives: List<AlternativeChoice>,
        val date: String,
    ) : DashboardPrimary

    @Serializable
    @SerialName("back-to-today")
    data object BackToToday : DashboardPrimary

    @Serializable
    @SerialName("none")
    data object None : DashboardPrimary
}

@Serializable
data class LoggedExercise(
    val done: String,
    val isAsPrescribed: Boolean,
    val isPrimary: Boolean,
    val name: String,
    val prescribed: String,
    val avgRpe: String? = null,
)

@Serializable
data class LoggedSummary(
    val exerciseCount: Int,
    val minutes: Int,
    val totalSets: Int,
    val avgRpe: String? = null,
)

@Serializable
data class LoggedSessionView(
    val exercises: List<LoggedExercise>,
    val notes: List<String>,
    val summary: LoggedSummary,
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface DashboardBody {
    @Serializable
    @SerialName("prescription")
    data class Plan(
        val exercises: List<PrescribedExercise>,
        val loadHeader: String,
    ) : DashboardBody

    @Serializable
    @SerialName("log")
    data class Log(
        val view: LoggedSessionView,
    ) : DashboardBody

    @Serializable
    @SerialName("rest")
    data class Rest(
        val copy: String,
    ) : DashboardBody
}

@Serializable
data class DashboardProgram(
    val blockId: String,
    val name: String,
    val versionId: String,
)

@Serializable
data class Toned(
    val text: String,
    val tone: String,
)

@Serializable
data class DashboardEyebrow(
    val program: DashboardProgram? = null,
    val status: Toned? = null,
    val weekCount: String? = null,
)

@Serializable
data class DashboardHeader(
    val eyebrow: DashboardEyebrow,
    val primary: DashboardPrimary,
    val title: String,
)

@Serializable
data class DashboardSession(
    val label: String,
    val summary: String,
)

@Serializable
data class BodyWeightTrend(
    val dates: List<String>,
    val series: List<Double>,
    val latestWeightLb: Double? = null,
)

@Serializable
data class RowPaceTrend(
    val dates: List<String>,
    val values: List<Double>,
    val latestSplitSec: Double,
)

@Serializable
data class StrengthTrend(
    val dates: List<String>,
    val exerciseId: String,
    val unit: LoadUnit,
    val values: List<Double>,
)

@Serializable
data class Trends(
    val bodyWeight: BodyWeightTrend,
    val names: Map<String, String> = emptyMap(),
    val rowPace: RowPaceTrend? = null,
    val strengthSeries: List<StrengthTrend> = emptyList(),
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface WeekDay {
    val date: String
    val dayOfWeek: Int
    val isPast: Boolean
    val isToday: Boolean
    val label: String

    @Serializable
    @SerialName("rest")
    data class Rest(
        override val date: String,
        override val dayOfWeek: Int,
        override val isPast: Boolean,
        override val isToday: Boolean,
        override val label: String,
    ) : WeekDay

    @Serializable
    @SerialName("planned")
    data class Planned(
        override val date: String,
        override val dayOfWeek: Int,
        override val isPast: Boolean,
        override val isToday: Boolean,
        override val label: String,
        val name: String,
        val summary: String,
        val signature: String? = null,
    ) : WeekDay

    @Serializable
    @SerialName("logged")
    data class Logged(
        override val date: String,
        override val dayOfWeek: Int,
        override val isPast: Boolean,
        override val isToday: Boolean,
        override val label: String,
        val name: String,
        val summary: String,
    ) : WeekDay
}

@Serializable
data class WeekData(
    val days: List<WeekDay>,
    val selectedDate: String,
    val today: String,
    val weekOffset: Int,
)

@Serializable
data class WeekResponse(
    val days: List<WeekDay>,
)

@Serializable
data class DashboardData(
    val body: DashboardBody,
    val header: DashboardHeader,
    val names: Map<String, String>,
    val trends: Trends,
    val week: WeekData,
    val session: DashboardSession? = null,
)

@Serializable
data class ExecutionContext(
    val concept2Connected: Boolean,
    val exerciseModalities: Map<String, String>,
    val exerciseNames: Map<String, String>,
)

@Serializable
data class WorkoutData(
    val concept2Connected: Boolean,
    val exerciseModalities: Map<String, String>,
    val exerciseNames: Map<String, String>,
    val explanations: Map<String, String>,
    val session: WorkoutSession,
)

@Serializable
data class OfflineOption(
    val estimatedDurationMin: Int,
    val explanations: Map<String, String>,
    val prescribedExercises: List<PrescribedExercise>,
    val alternativeId: String? = null,
    val label: String? = null,
)

@Serializable
data class OfflinePlanDay(
    val date: String,
    val options: List<OfflineOption>,
    val templateName: String,
)

@Serializable
data class OfflinePlan(
    val concept2Connected: Boolean,
    val exerciseModalities: Map<String, String>,
    val exerciseNames: Map<String, String>,
    val days: List<OfflinePlanDay>,
    val today: String,
)

@Serializable
data class Adaptation(
    val exerciseName: String,
    val explanation: String,
    val progressed: Boolean,
    val slotId: String,
)

@Serializable
data class PersonalRecordView(
    val id: String,
    val name: String,
    val text: String,
)

@Serializable
data class CompleteStats(
    val durationMin: Int,
    val prCount: Int,
    val totalSets: Int,
)

@Serializable
data class CompleteData(
    val adaptations: List<Adaptation>,
    val exerciseNames: Map<String, String>,
    val personalRecords: List<PersonalRecordView>,
    val results: List<ExerciseResult>,
    val scheduledDate: String,
    val sessionId: String,
    val stats: CompleteStats,
)

@Serializable
data class HistoryRow(
    val badge: Toned,
    val href: String,
    val id: String,
    val meta: String,
    val name: String,
) {
    /** Completed rows open the summary; in-progress rows resume the workout. */
    val isComplete: Boolean get() = href.endsWith("/complete")
}

@Serializable
data class HistoryData(
    val rows: List<HistoryRow>,
)

@Serializable
data class BodyMetricsData(
    val metrics: List<BodyMetric>,
)

@Serializable
data class ProgramBlockCard(
    val active: Boolean,
    val id: String,
    val meta: String,
    val name: String,
    val versionId: String,
)

@Serializable
data class ProgramCard(
    val blocks: List<ProgramBlockCard>,
    val description: String,
    val goals: List<String>,
    val name: String,
    val versionId: String,
)

@Serializable
data class ProgramsData(
    val others: List<ProgramCard>,
    val active: ProgramCard? = null,
)

@Serializable
data class BlockSlotView(
    val id: String,
    val name: String,
    val prescription: Prescription,
    val role: String,
    val position: Int? = null,
)

@Serializable
data class BlockOptionView(
    val slots: List<BlockSlotView>,
    val label: String? = null,
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface BlockDayContent {
    @Serializable
    @SerialName("slots")
    data class Slots(
        val slots: List<BlockSlotView>,
    ) : BlockDayContent

    @Serializable
    @SerialName("options")
    data class Options(
        val hint: String,
        val options: List<BlockOptionView>,
    ) : BlockDayContent
}

@Serializable
data class BlockDayView(
    val content: BlockDayContent,
    val dayName: String,
    val durationMin: Int,
    val key: String,
    val name: String,
    val variantTag: String? = null,
)

@Serializable
data class BlockWeekView(
    val days: List<BlockDayView>,
    val isDeload: Boolean,
    val summary: String,
    val week: Int,
)

@Serializable
@JsonClassDiscriminator("kind")
sealed interface BlockLayout {
    @Serializable
    @SerialName("weeks")
    data class Weeks(
        val weeks: List<BlockWeekView>,
    ) : BlockLayout

    @Serializable
    @SerialName("fixed")
    data class Fixed(
        val days: List<BlockDayView>,
    ) : BlockLayout
}

@Serializable
@JsonClassDiscriminator("kind")
sealed interface BlockOutcome {
    @Serializable
    @SerialName("next")
    data class Next(
        val blockId: String,
        val name: String,
    ) : BlockOutcome

    @Serializable
    @SerialName("complete")
    data object Complete : BlockOutcome

    @Serializable
    @SerialName("repeats")
    data object Repeats : BlockOutcome
}

@Serializable
data class BlockView(
    val active: Boolean,
    val blockId: String,
    val layout: BlockLayout,
    val name: String,
    val outcome: BlockOutcome,
    val programName: String,
    val versionId: String,
)

@Serializable
data class SettingsData(
    val accountEmail: String,
    val concept2Connected: Boolean,
    val concept2WorkoutCount: Int = 0,
)

@Serializable
data class SessionUser(
    val email: String,
    val name: String,
    val picture: String? = null,
)

@Serializable
data class SessionResponse(
    val user: SessionUser,
)

@Serializable
data class TokenResponse(
    val token: String,
    val user: SessionUser,
)

@Serializable
data class IdResponse(
    val id: String,
)

@Serializable
data class FinishResponse(
    val personalRecords: List<kotlinx.serialization.json.JsonElement> = emptyList(),
)

@Serializable
@JsonClassDiscriminator("status")
sealed interface Concept2Match {
    @Serializable
    @SerialName("matched")
    data class Matched(
        val normalized: NormalizedWorkout,
    ) : Concept2Match

    @Serializable
    @SerialName("ambiguous")
    data class Ambiguous(
        val candidates: List<NormalizedWorkout>,
    ) : Concept2Match

    @Serializable
    @SerialName("not-matched")
    data object NotMatched : Concept2Match
}
