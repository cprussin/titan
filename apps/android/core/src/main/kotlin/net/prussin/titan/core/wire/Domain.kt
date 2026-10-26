package net.prussin.titan.core.wire

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

// Mirrors `@titan/domain` — the shapes the server stores and the app echoes back.

@Serializable
enum class LoadUnit(
    val label: String,
) {
    @SerialName("lb")
    LB("lb"),

    @SerialName("kg")
    KG("kg"),
    ;

    /** The coarse and fine stepper increments (`coarseLoadStep`, `fineLoadStep`). */
    val fineStep: Double get() = if (this == KG) 1.0 else 2.5

    companion object {
        const val COARSE_STEP = 5.0
    }
}

@Serializable
enum class BandLevel(
    val label: String,
) {
    @SerialName("red")
    RED("Red"),

    @SerialName("black")
    BLACK("Black"),

    @SerialName("purple")
    PURPLE("Purple"),

    @SerialName("green")
    GREEN("Green"),
    ;

    companion object {
        /** `BAND_COMBINATIONS`: the stacks the band picker offers, lightest first. */
        val COMBINATIONS: List<List<BandLevel>> =
            listOf(
                listOf(RED),
                listOf(BLACK),
                listOf(PURPLE),
                listOf(GREEN),
                listOf(GREEN, RED),
                listOf(GREEN, BLACK),
                listOf(GREEN, PURPLE),
                listOf(GREEN, PURPLE, RED),
                listOf(GREEN, PURPLE, BLACK),
                listOf(GREEN, PURPLE, BLACK, RED),
            )
    }
}

@Serializable
sealed interface Prescription {
    /** Work done in counted sets, logged one set at a time (`isSetBased`). */
    sealed interface SetBased : Prescription {
        val sets: Int
    }

    /** Set-based work timed rather than counted. */
    sealed interface Timed : SetBased

    @Serializable
    @SerialName("strength")
    data class Strength(
        override val sets: Int,
        val reps: Int,
        val weight: Double,
        val unit: LoadUnit = LoadUnit.LB,
        val rpeTarget: Double? = null,
    ) : SetBased

    @Serializable
    @SerialName("bodyweight")
    data class Bodyweight(
        override val sets: Int,
        val reps: Int,
        val addedWeight: Double? = null,
        val unit: LoadUnit = LoadUnit.LB,
    ) : SetBased

    @Serializable
    @SerialName("band")
    data class Band(
        override val sets: Int,
        val reps: Int,
    ) : SetBased

    @Serializable
    @SerialName("timed-hold")
    data class TimedHold(
        override val sets: Int,
        val holdSec: Double,
        val addedWeight: Double? = null,
        val unit: LoadUnit = LoadUnit.LB,
    ) : Timed

    @Serializable
    @SerialName("timed-carry")
    data class TimedCarry(
        override val sets: Int,
        val durationSec: Double,
        val weight: Double,
        val unit: LoadUnit = LoadUnit.LB,
    ) : Timed

    @Serializable
    @SerialName("timed-effort")
    data class TimedEffort(
        override val sets: Int,
        val workSec: Double,
        val restSec: Double,
    ) : Timed

    @Serializable
    @SerialName("timed-cardio")
    data class TimedCardio(
        val durationSec: Double,
        val targetHrZone: Int? = null,
        val strokeRateMin: Double? = null,
        val strokeRateMax: Double? = null,
    ) : Prescription

    @Serializable
    @SerialName("distance-cardio")
    data class DistanceCardio(
        val distanceMeters: Double,
        val targetSplitSecPer500: Double? = null,
    ) : Prescription

    @Serializable
    @SerialName("intervals")
    data class Intervals(
        val count: Int,
        val recoverySec: Double,
        val workDistanceMeters: Double? = null,
        val workSec: Double? = null,
        val targetSplitSecPer500: Double? = null,
    ) : Prescription

    @Serializable
    @SerialName("circuit")
    data class Circuit(
        val rounds: Int,
        val restSec: Double,
        val stations: List<CircuitStation>,
    ) : Prescription
}

@Serializable
data class CircuitStation(
    val exerciseId: String,
    val distanceMeters: Double? = null,
    val durationSec: Double? = null,
    val reps: Int? = null,
)

@Serializable
data class SetResult(
    val setIndex: Int,
    val completed: Boolean,
    val bands: List<BandLevel>? = null,
    val durationSec: Double? = null,
    val holdSec: Double? = null,
    val reps: Int? = null,
    val rpe: Double? = null,
    val weight: Double? = null,
)

@Serializable
data class CardioResult(
    val avgHr: Double? = null,
    val avgStrokeRate: Double? = null,
    val distanceMeters: Double? = null,
    val durationSec: Double? = null,
    val hrDrift: Double? = null,
    val splitSecPer500: Double? = null,
)

@Serializable
data class IntervalResult(
    val index: Int,
    val avgHr: Double? = null,
    val distanceMeters: Double? = null,
    val durationSec: Double? = null,
    val splitSecPer500: Double? = null,
    val strokeRate: Double? = null,
)

@Serializable
data class ExerciseResult(
    val id: String,
    val exerciseId: String,
    val slotId: String,
    val prescription: Prescription,
    val sets: List<SetResult>,
    val cardio: CardioResult? = null,
    val intervals: List<IntervalResult>? = null,
    val notes: String? = null,
    val recordedAt: String? = null,
)

@Serializable
data class WarmupSet(
    val reps: Int,
    val weight: Double,
)

@Serializable
data class PrescribedExercise(
    val exerciseId: String,
    val slotId: String,
    val role: String,
    val prescription: Prescription,
    val progression: JsonElement? = null,
    val previous: ExerciseResult? = null,
    val warmup: List<WarmupSet>? = null,
)

@Serializable
data class InProgressExercise(
    val slotId: String,
    val sets: List<SetResult>,
)

@Serializable
data class WorkoutSession(
    val id: String,
    val status: String,
    val scheduledDate: String,
    val prescribedExercises: List<PrescribedExercise>,
    val results: List<ExerciseResult>,
    val sessionTemplateId: String,
    val estimatedDurationMin: Int,
    val weekNumber: Int,
    val inProgress: InProgressExercise? = null,
    val startedAt: String? = null,
    val completedAt: String? = null,
    val variantLabel: String? = null,
)

@Serializable
data class NormalizedWorkout(
    val intervals: List<IntervalResult>,
    val summary: CardioResult,
    val workoutAt: String,
)

@Serializable
data class BodyMetric(
    val id: String,
    val date: String,
    val weightLb: Double,
)
