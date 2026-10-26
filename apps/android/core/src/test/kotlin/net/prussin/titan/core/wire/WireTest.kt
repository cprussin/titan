package net.prussin.titan.core.wire

import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/** Decodes responses captured from a real server, so the models track the wire. */
class WireTest {
    private inline fun <reified T> fixture(name: String): T =
        WireJson.decodeFromString(
            checkNotNull(javaClass.getResource("/fixtures/$name.json")) { name }.readText(),
        )

    @Test
    fun `decodes every dashboard state`() {
        val logged = fixture<DashboardData>("dashboard-logged")
        assertTrue(logged.body is DashboardBody.Log)
        assertEquals(DashboardPrimary.BackToToday, logged.header.primary)
        val fill = fixture<DashboardData>("dashboard-fill").header.primary
        assertEquals("2026-10-22", (fill as DashboardPrimary.FillWorkout).date)
        val continuing = fixture<DashboardData>("dashboard-continue").header.primary
        assertTrue((continuing as DashboardPrimary.StartWorkout).action is WorkoutAction.Continue)
        val today = fixture<DashboardData>("dashboard-today")
        assertEquals(7, today.week.days.size)
        assertEquals(5, today.trends.bodyWeight.series.size)
        fixture<DashboardData>("dashboard-future")
    }

    @Test
    fun `decodes workouts, plans, and summaries`() {
        val workout = fixture<WorkoutData>("workout-inprogress")
        assertEquals(2, workout.session.results.size)
        assertTrue(workout.session.prescribedExercises[0].prescription is Prescription.Strength)
        val plan = fixture<OfflinePlan>("plan")
        assertTrue(plan.days.isNotEmpty())
        val complete = fixture<CompleteData>("complete")
        assertEquals(3, complete.personalRecords.size)
        fixture<CompleteData>("complete-row")
    }

    @Test
    fun `decodes history, programs, blocks, and settings`() {
        assertFalse(fixture<HistoryData>("history").rows[0].isComplete)
        assertEquals(5, fixture<BodyMetricsData>("body-metrics").metrics.size)
        assertTrue(fixture<ProgramsData>("programs").others.isNotEmpty())
        assertTrue(fixture<BlockView>("block-weeks").layout is BlockLayout.Weeks)
        assertTrue(fixture<BlockView>("block-fixed").layout is BlockLayout.Fixed)
        assertFalse(fixture<SettingsData>("settings").concept2Connected)
        assertEquals("a@b.c", fixture<SessionResponse>("session").user.email)
        assertTrue(fixture<WorkoutActionResponse>("workout-action").action is WorkoutAction.Start)
        assertEquals(7, fixture<WeekResponse>("week-prev").days.size)
    }

    @Test
    fun `encodes results the way the server's schemas read them`() {
        val result =
            ExerciseResult(
                id = "r",
                exerciseId = "squat",
                slotId = "s",
                prescription = Prescription.Strength(sets = 3, reps = 5, weight = 100.0),
                sets = listOf(SetResult(setIndex = 0, completed = true, reps = 5, weight = 100.0, rpe = 8.0)),
            )
        val json = WireJson.encodeToJsonElement(ExerciseResult.serializer(), result).jsonObject
        val prescription = json.getValue("prescription").jsonObject
        assertEquals("strength", prescription.getValue("type").jsonPrimitive.content)
        assertEquals("lb", prescription.getValue("unit").jsonPrimitive.content)
        assertFalse("cardio" in json)
    }
}
