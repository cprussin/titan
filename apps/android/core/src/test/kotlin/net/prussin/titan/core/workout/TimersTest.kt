package net.prussin.titan.core.workout

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TimersTest {
    @Test
    fun `rest shows whole seconds left and runs into overtime`() {
        val rest = WorkoutTimer.Rest(endsAtMs = 90_000)
        assertEquals(90, rest.remaining(0))
        assertEquals(90, rest.remaining(500))
        assertEquals(89, rest.remaining(1_000))
        assertEquals(0, rest.remaining(90_500))
        assertEquals(-1, rest.remaining(91_000))
        assertEquals(TimerPhase.WARNING, rest.phase(80_000))
        assertEquals(TimerPhase.OVERTIME, rest.phase(90_000))
        assertEquals(120, rest.extended(30).remaining(0))
    }

    @Test
    fun `effort accumulates across stops`() {
        val effort =
            WorkoutTimer
                .Effort(targetSec = 30)
                .toggled(0)
                .toggled(10_000)
                .toggled(20_000)
        assertEquals(15, effort.elapsed(25_000))
        assertEquals(15, effort.display(25_000))
        assertEquals(TimerPhase.RUNNING, effort.phase(25_000))
        assertEquals(TimerPhase.IDLE, WorkoutTimer.Effort().phase(0))
        assertEquals("Start", WorkoutTimer.Effort().primaryLabel(0))
    }

    @Test
    fun `ticks the last ten seconds and chimes until stopped`() {
        val tracker = CueTracker()
        val rest = WorkoutTimer.Rest(endsAtMs = 11_000)
        assertEquals(emptyList<Cue>(), tracker.update(rest, 0))
        assertEquals(listOf(Cue.TICK), tracker.update(rest, 1_000))
        assertEquals(emptyList<Cue>(), tracker.update(rest, 1_500))
        assertEquals(listOf(Cue.CHIME_START), tracker.update(rest, 11_000))
        assertEquals(emptyList<Cue>(), tracker.update(rest, 12_000))
        assertEquals(listOf(Cue.CHIME_STOP), tracker.update(null, 13_000))
    }

    @Test
    fun `stops an effort's chime when the stopwatch stops`() {
        val tracker = CueTracker()
        val running = WorkoutTimer.Effort(targetSec = 1).toggled(0)
        tracker.update(running, 0)
        assertEquals(listOf(Cue.CHIME_START), tracker.update(running, 1_000))
        assertEquals(listOf(Cue.CHIME_STOP), tracker.update(running.toggled(2_000), 2_000))
    }
}
