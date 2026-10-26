package net.prussin.titan.core.workout

import net.prussin.titan.core.wire.InProgressExercise
import net.prussin.titan.core.wire.PrescribedExercise
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.wire.SetResult
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class WorkoutRunTest {
    private val squat =
        PrescribedExercise(
            exerciseId = "squat",
            slotId = "s1",
            role = "primary",
            prescription = Prescription.Strength(sets = 2, reps = 5, weight = 100.0),
        )
    private val row =
        PrescribedExercise(
            exerciseId = "rower",
            slotId = "s2",
            role = "accessory",
            prescription = Prescription.DistanceCardio(distanceMeters = 2000.0),
        )
    private val run =
        WorkoutRun(
            sessionId = "w",
            scheduledDate = "2026-10-26",
            startedAtMs = 0,
            prescribed = listOf(squat, row),
            exerciseNames = mapOf("squat" to "Back Squat"),
        )

    @Test
    fun `defaults the fields from the prescription`() {
        assertEquals(SetDraft(weight = 100.0, reps = 5, seconds = 0.0), run.setDraft)
        assertEquals("Back Squat", run.name(squat))
        assertEquals("rower", run.name(row))
    }

    @Test
    fun `refuses to log an unrated set`() {
        assertThrows<IllegalStateException> { run.logSet(0) }
    }

    @Test
    fun `logs a set, saves it, and starts the role's rest`() {
        val step = run.withDraft { it.copy(weight = 105.0, rpe = 8) }.logSet(nowMs = 1_000)
        val set = SetResult(setIndex = 0, completed = true, reps = 5, weight = 105.0, rpe = 8.0)
        assertEquals(listOf(set), step.run.logged)
        assertEquals(WorkoutTimer.Rest(endsAtMs = 151_000), step.run.timer)
        assertEquals(listOf(WorkoutSave.Sets("w", InProgressExercise("s1", listOf(set)))), step.saves)
        assertEquals(105.0, step.run.setDraft?.weight)
        assertNull(step.run.setDraft?.rpe)
    }

    @Test
    fun `skips rest after the last set and keeps the fields`() {
        val first =
            run
                .withDraft { it.copy(rpe = 7) }
                .logSet(0)
                .run
                .stopRest()
        val second = first.withDraft { it.copy(reps = 4, rpe = 9) }.logSet(0).run
        assertNull(second.timer)
        assertEquals(4, second.setDraft?.reps)
        assertNull(second.setDraft?.rpe)
    }

    @Test
    fun `undoes the last set back into the fields`() {
        val logged = run.withDraft { it.copy(weight = 110.0, reps = 3, rpe = 9) }.logSet(0).run
        val step = logged.undoLastSet()
        assertEquals(emptyList<SetResult>(), step.run.logged)
        assertEquals(SetDraft(weight = 110.0, reps = 3, seconds = 0.0, rpe = 9), step.run.setDraft)
        assertNull(step.run.timer)
    }

    @Test
    fun `records an exercise, then finishes on the last`() {
        val logged =
            run
                .withDraft { it.copy(rpe = 7) }
                .logSet(0)
                .run
                .stopRest()
        val recorded = logged.completeSets("r1", "2026-10-26T13:00:00Z")
        assertEquals(1, recorded.run.index)
        assertTrue(recorded.saves.single() is WorkoutSave.Recorded)
        val cardio =
            recorded.run
                .withCardio { it.copy(distance = "2000", duration = "8:00", avgHr = "") }
                .completeCardio("r2", "2026-10-26T13:10:00Z")
        val finished = cardio.saves.single() as WorkoutSave.Finished
        assertEquals(120.0, finished.result.cardio?.splitSecPer500)
        assertNull(finished.result.cardio?.avgHr)
        assertTrue(cardio.run.isFinished)
    }

    @Test
    fun `uses the effort time for cardio duration`() {
        val onRow =
            run.copy(
                results =
                    listOf(
                        run.completeSets("r", "t").saves.single().let {
                            (it as WorkoutSave.Recorded).result
                        },
                    ),
            )
        val started = onRow.toggleEffort(nowMs = 0)
        val stopped = started.toggleEffort(nowMs = 95_400)
        assertEquals("Resume", stopped.effort?.primaryLabel(95_400))
        assertEquals("1:35", stopped.useEffortTime(95_400).cardio.duration)
        assertNull(stopped.resetEffort().timer)
    }

    @Test
    fun `resumes the sets underway only for the current slot`() {
        val sets = listOf(SetResult(setIndex = 0, completed = true, reps = 5, weight = 100.0))

        fun resumed(slot: String) =
            WorkoutRun.resume(
                "w",
                "d",
                0,
                listOf(squat, row),
                emptyList(),
                InProgressExercise(slot, sets),
                emptyMap(),
                emptyMap(),
                emptyMap(),
                false,
            )
        assertEquals(sets, resumed("s1").logged)
        assertEquals(emptyList<SetResult>(), resumed("s2").logged)
    }

    @Test
    fun `rests timed effort on its own rest`() {
        val effort = squat.copy(prescription = Prescription.TimedEffort(sets = 3, workSec = 30.0, restSec = 45.0))
        assertEquals(45, restSeconds(effort))
        assertEquals(90, restSeconds(row))
        assertEquals(150, restSeconds(squat))
    }
}
