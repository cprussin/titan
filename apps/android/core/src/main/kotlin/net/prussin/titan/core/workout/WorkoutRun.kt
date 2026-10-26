package net.prussin.titan.core.workout

import kotlinx.serialization.Serializable
import net.prussin.titan.core.format.formatClock
import net.prussin.titan.core.format.parseDuration
import net.prussin.titan.core.wire.BandLevel
import net.prussin.titan.core.wire.CardioResult
import net.prussin.titan.core.wire.ExerciseResult
import net.prussin.titan.core.wire.InProgressExercise
import net.prussin.titan.core.wire.LoadUnit
import net.prussin.titan.core.wire.NormalizedWorkout
import net.prussin.titan.core.wire.PrescribedExercise
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.wire.SetResult

/** What the strength logger's fields hold for the next set (`StrengthLogger`'s state). */
@Serializable
data class SetDraft(
    val weight: Double,
    val reps: Int,
    val seconds: Double,
    val bands: List<BandLevel>? = null,
    val rpe: Int? = null,
) {
    companion object {
        /** `next-set-defaults.ts`: weight carries over, reps and time reset to the prescription. */
        fun next(
            prescription: Prescription,
            logged: List<SetResult>,
        ): SetDraft =
            SetDraft(
                weight = logged.lastOrNull()?.weight ?: prescribedWeight(prescription),
                reps = prescribedReps(prescription),
                seconds = prescribedSeconds(prescription),
                bands = logged.lastOrNull()?.bands,
            )

        fun prescribedSeconds(prescription: Prescription): Double =
            when (prescription) {
                is Prescription.TimedHold -> prescription.holdSec
                is Prescription.TimedCarry -> prescription.durationSec
                is Prescription.TimedEffort -> prescription.workSec
                else -> 0.0
            }

        private fun prescribedReps(prescription: Prescription): Int =
            when (prescription) {
                is Prescription.Strength -> prescription.reps
                is Prescription.Bodyweight -> prescription.reps
                is Prescription.Band -> prescription.reps
                else -> 0
            }

        private fun prescribedWeight(prescription: Prescription): Double =
            when (prescription) {
                is Prescription.Strength -> prescription.weight
                is Prescription.TimedCarry -> prescription.weight
                else -> 0.0
            }
    }
}

/** The cardio logger's text fields, kept as typed (`CardioLogger`). */
@Serializable
data class CardioDraft(
    val distance: String = "",
    val duration: String = "",
    val avgHr: String = "",
)

/** A save the server must eventually see, in order (`WorkoutProgressRequest`). */
sealed interface WorkoutSave {
    val sessionId: String

    data class Sets(
        override val sessionId: String,
        val inProgress: InProgressExercise,
    ) : WorkoutSave

    data class Recorded(
        override val sessionId: String,
        val result: ExerciseResult,
    ) : WorkoutSave

    data class Finished(
        override val sessionId: String,
        val result: ExerciseResult,
    ) : WorkoutSave
}

data class Step(
    val run: WorkoutRun,
    val saves: List<WorkoutSave>,
)

/**
 * A workout underway on this phone — the web's `WorkoutExecution` state plus
 * everything needed to keep going offline. Every transition is pure and
 * returns the saves it owes the server.
 */
@Serializable
data class WorkoutRun(
    val sessionId: String,
    val scheduledDate: String,
    val startedAtMs: Long,
    val prescribed: List<PrescribedExercise>,
    val exerciseNames: Map<String, String>,
    val modalities: Map<String, String> = emptyMap(),
    val explanations: Map<String, String> = emptyMap(),
    val concept2Connected: Boolean = false,
    val results: List<ExerciseResult> = emptyList(),
    val logged: List<SetResult> = emptyList(),
    val draft: SetDraft? = null,
    val cardio: CardioDraft = CardioDraft(),
    val timer: WorkoutTimer? = null,
) {
    val index: Int get() = results.size
    val current: PrescribedExercise? get() = prescribed.getOrNull(index)
    val next: PrescribedExercise? get() = prescribed.getOrNull(index + 1)
    val isFinished: Boolean get() = index >= prescribed.size
    val resting: Boolean get() = timer is WorkoutTimer.Rest

    fun name(exercise: PrescribedExercise): String = exerciseNames[exercise.exerciseId] ?: exercise.exerciseId

    /** The fields for the set underway, defaulted from the prescription when untouched. */
    val setDraft: SetDraft?
        get() = draft ?: current?.let { SetDraft.next(it.prescription, logged) }

    fun withDraft(update: (SetDraft) -> SetDraft): WorkoutRun = setDraft?.let { copy(draft = update(it)) } ?: this

    fun withCardio(update: (CardioDraft) -> CardioDraft): WorkoutRun = copy(cardio = update(cardio))

    /** Log the set underway (`onLogSet`); rest follows unless it was the last set. */
    fun logSet(nowMs: Long): Step {
        val exercise = checkNotNull(current) { "logSet with no exercise underway" }
        val prescription = exercise.prescription as Prescription.SetBased
        val entered = checkNotNull(setDraft)
        val rpe = checkNotNull(entered.rpe) { "Log set pressed before the set was rated" }
        val set =
            setMetrics(prescription, entered).copy(
                setIndex = logged.size,
                completed = true,
                rpe = rpe.toDouble(),
            )
        val nowLogged = logged + set
        val rests = nowLogged.size < prescription.sets
        val next =
            if (rests) {
                copy(
                    logged = nowLogged,
                    draft = null,
                    timer = WorkoutTimer.Rest(nowMs + restSeconds(exercise) * 1000L),
                )
            } else {
                copy(logged = nowLogged, draft = entered.copy(rpe = null))
            }
        return Step(next, listOf(next.setsSave(exercise)))
    }

    /** Change a logged set in place (`onEditSet`). */
    fun editSet(
        position: Int,
        set: SetResult,
    ): Step {
        val exercise = checkNotNull(current)
        val next = copy(logged = logged.mapIndexed { index, existing -> if (index == position) set else existing })
        return Step(next, listOf(next.setsSave(exercise)))
    }

    /** "Back": undo the last set, restoring its values to the fields. */
    fun undoLastSet(): Step {
        val exercise = checkNotNull(current)
        val last = checkNotNull(logged.lastOrNull()) { "Back pressed with no logged set to undo" }
        val fields = checkNotNull(setDraft)
        val restored =
            fields.copy(
                weight = last.weight ?: fields.weight,
                reps = last.reps ?: fields.reps,
                seconds = last.durationSec ?: last.holdSec ?: fields.seconds,
                bands = last.bands,
                rpe = last.rpe?.toInt(),
            )
        val next = copy(logged = logged.dropLast(1), draft = restored, timer = null)
        return Step(next, listOf(next.setsSave(exercise)))
    }

    /** "Complete exercise" / "Finish early": record the logged sets. */
    fun completeSets(
        resultId: String,
        recordedAt: String,
    ): Step {
        val exercise = checkNotNull(current)
        return advance(
            ExerciseResult(
                id = resultId,
                exerciseId = exercise.exerciseId,
                slotId = exercise.slotId,
                prescription = exercise.prescription,
                sets = logged,
                recordedAt = recordedAt,
            ),
        )
    }

    /** The cardio logger's "Complete": distance, duration, split, and heart rate as typed. */
    fun completeCardio(
        resultId: String,
        recordedAt: String,
    ): Step {
        val exercise = checkNotNull(current)
        val distance =
            cardio.distance
                .trim()
                .toDoubleOrNull()
                ?.takeIf { it > 0 }
        val duration = parseDuration(cardio.duration)?.takeIf { it > 0 }
        val heart =
            cardio.avgHr
                .trim()
                .toDoubleOrNull()
                ?.takeIf { it > 0 }
        return advance(
            ExerciseResult(
                id = resultId,
                exerciseId = exercise.exerciseId,
                slotId = exercise.slotId,
                prescription = exercise.prescription,
                sets = emptyList(),
                cardio =
                    CardioResult(
                        distanceMeters = distance,
                        durationSec = duration,
                        splitSecPer500 =
                            if (distance != null &&
                                duration != null
                            ) {
                                duration / (distance / 500)
                            } else {
                                null
                            },
                        avgHr = heart,
                    ),
                recordedAt = recordedAt,
            ),
        )
    }

    /** A Concept2 row found for this piece (`buildImportResult`). */
    fun completeImported(
        resultId: String,
        recordedAt: String,
        normalized: NormalizedWorkout,
    ): Step {
        val exercise = checkNotNull(current)
        return advance(
            ExerciseResult(
                id = resultId,
                exerciseId = exercise.exerciseId,
                slotId = exercise.slotId,
                prescription = exercise.prescription,
                sets = emptyList(),
                cardio = normalized.summary,
                intervals = normalized.intervals.ifEmpty { null },
                recordedAt = recordedAt,
            ),
        )
    }

    private fun advance(result: ExerciseResult): Step {
        val isLast = index + 1 >= prescribed.size
        val next =
            copy(results = results + result, logged = emptyList(), draft = null, cardio = CardioDraft(), timer = null)
        val save = if (isLast) WorkoutSave.Finished(sessionId, result) else WorkoutSave.Recorded(sessionId, result)
        return Step(next, listOf(save))
    }

    fun addRest(seconds: Int): WorkoutRun =
        (timer as? WorkoutTimer.Rest)?.let { copy(timer = it.extended(seconds)) } ?: this

    fun stopRest(): WorkoutRun = if (timer is WorkoutTimer.Rest) copy(timer = null) else this

    /** The effort timer for the piece underway, idle until started. */
    val effort: WorkoutTimer.Effort?
        get() =
            when (val active = timer) {
                is WorkoutTimer.Effort -> {
                    active
                }

                is WorkoutTimer.Rest -> {
                    null
                }

                null -> {
                    current?.let { exercise ->
                        effortTarget(exercise.prescription)?.let { WorkoutTimer.Effort(targetSec = it.target) }
                    }
                }
            }

    fun toggleEffort(nowMs: Long): WorkoutRun = effort?.let { copy(timer = it.toggled(nowMs)) } ?: this

    fun resetEffort(): WorkoutRun = if (timer is WorkoutTimer.Effort) copy(timer = null) else this

    /** "Use time": the stopped effort's seconds go into the set or cardio duration. */
    fun useEffortTime(nowMs: Long): WorkoutRun {
        val elapsed = effort?.elapsed(nowMs) ?: return this
        return when (current?.prescription) {
            is Prescription.Timed -> withDraft { it.copy(seconds = elapsed.toDouble()) }
            null, is Prescription.SetBased -> this
            else -> withCardio { it.copy(duration = formatClock(elapsed)) }
        }
    }

    private fun setsSave(exercise: PrescribedExercise): WorkoutSave =
        WorkoutSave.Sets(sessionId, InProgressExercise(slotId = exercise.slotId, sets = logged))

    companion object {
        /** Seed a run from the server's session, resuming where it left off (`resumeWorkout`). */
        fun resume(
            sessionId: String,
            scheduledDate: String,
            startedAtMs: Long,
            prescribed: List<PrescribedExercise>,
            results: List<ExerciseResult>,
            inProgress: InProgressExercise?,
            exerciseNames: Map<String, String>,
            modalities: Map<String, String>,
            explanations: Map<String, String>,
            concept2Connected: Boolean,
        ): WorkoutRun =
            WorkoutRun(
                sessionId = sessionId,
                scheduledDate = scheduledDate,
                startedAtMs = startedAtMs,
                prescribed = prescribed,
                exerciseNames = exerciseNames,
                modalities = modalities,
                explanations = explanations,
                concept2Connected = concept2Connected,
                results = results,
                logged =
                    if (inProgress != null && inProgress.slotId == prescribed.getOrNull(results.size)?.slotId) {
                        inProgress.sets
                    } else {
                        emptyList()
                    },
            )
    }
}

/** Whether the effort timer shows, and what it counts down from. */
data class EffortTarget(
    val target: Int?,
)

fun effortTarget(prescription: Prescription): EffortTarget? =
    when (prescription) {
        is Prescription.Timed -> EffortTarget(SetDraft.prescribedSeconds(prescription).toInt())
        is Prescription.TimedCardio -> EffortTarget(prescription.durationSec.toInt())
        is Prescription.DistanceCardio, is Prescription.Intervals, is Prescription.Circuit -> EffortTarget(null)
        is Prescription.Strength, is Prescription.Bodyweight, is Prescription.Band -> null
    }

/** Rest after a set: timed conditioning's own rest, else the role's default. */
fun restSeconds(exercise: PrescribedExercise): Int =
    when (val prescription = exercise.prescription) {
        is Prescription.TimedEffort -> prescription.restSec.toInt()
        else -> if (exercise.role == "primary") 150 else 90
    }

/** What a set records for each kind of set-based work (`setMetrics`). */
fun setMetrics(
    prescription: Prescription.SetBased,
    entered: SetDraft,
): SetResult {
    val blank = SetResult(setIndex = 0, completed = true)
    return when (prescription) {
        is Prescription.TimedHold -> blank.copy(holdSec = entered.seconds)
        is Prescription.TimedCarry -> blank.copy(durationSec = entered.seconds, weight = entered.weight)
        is Prescription.TimedEffort -> blank.copy(durationSec = entered.seconds, reps = entered.reps)
        is Prescription.Band -> blank.copy(reps = entered.reps, bands = entered.bands)
        is Prescription.Strength, is Prescription.Bodyweight -> blank.copy(reps = entered.reps, weight = entered.weight)
    }
}

/** The load unit a set-based prescription steps weight in, if it logs load. */
fun loadUnitOf(prescription: Prescription): LoadUnit? =
    when (prescription) {
        is Prescription.Strength -> prescription.unit
        is Prescription.TimedCarry -> prescription.unit
        else -> null
    }

/** Whether logged sets carry a weight (`logsLoad`). */
fun logsLoad(prescription: Prescription.SetBased): Boolean =
    prescription !is Prescription.TimedHold && prescription !is Prescription.Band &&
        prescription !is Prescription.TimedEffort

/** Whether sets count reps (`logsReps`). */
fun logsReps(prescription: Prescription.SetBased): Boolean =
    prescription !is Prescription.TimedHold && prescription !is Prescription.TimedCarry

/** "Hold" / "Duration" / "Work" (`secondsNoun`). */
fun secondsNoun(prescription: Prescription.Timed): String =
    when (prescription) {
        is Prescription.TimedHold -> "Hold"
        is Prescription.TimedCarry -> "Duration"
        is Prescription.TimedEffort -> "Work"
    }

/** A logged set's seconds and the field an edit writes them to. */
fun loggedSeconds(set: SetResult): Double? = set.durationSec ?: set.holdSec

fun withSeconds(
    prescription: Prescription.Timed,
    set: SetResult,
    seconds: Double,
): SetResult =
    if (prescription is Prescription.TimedHold) {
        set.copy(
            holdSec = seconds,
        )
    } else {
        set.copy(durationSec = seconds)
    }
