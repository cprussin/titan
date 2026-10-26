package net.prussin.titan.core.workout

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * The single timer a workout can run, anchored to wall-clock instants rather
 * than counted ticks, so it stays right across backgrounding and process death.
 */
@Serializable
sealed interface WorkoutTimer {
    /** Rest between sets (`RestTimer`): counts down past zero into overtime. */
    @Serializable
    @SerialName("rest")
    data class Rest(
        val endsAtMs: Long,
    ) : WorkoutTimer {
        /** Seconds left, as the web shows them: the full value until a whole second passes. */
        fun remaining(nowMs: Long): Int = -Math.floorDiv(nowMs - endsAtMs, 1000L).toInt()

        fun extended(seconds: Int): Rest = copy(endsAtMs = endsAtMs + seconds * 1000L)

        fun phase(nowMs: Long): TimerPhase = phaseOf(remaining(nowMs), running = true)
    }

    /** The effort stopwatch (`EffortTimer`): counts down from a target, or up without one. */
    @Serializable
    @SerialName("effort")
    data class Effort(
        val targetSec: Int? = null,
        val accumulatedMs: Long = 0,
        val runningSinceMs: Long? = null,
    ) : WorkoutTimer {
        val running: Boolean get() = runningSinceMs != null

        fun elapsedMs(nowMs: Long): Long = accumulatedMs + (runningSinceMs?.let { nowMs - it } ?: 0)

        fun elapsed(nowMs: Long): Int = (elapsedMs(nowMs) / 1000).toInt()

        fun remaining(nowMs: Long): Int? = targetSec?.let { it - elapsed(nowMs) }

        /** What the clock face shows: signed remaining against a target, else elapsed. */
        fun display(nowMs: Long): Int = remaining(nowMs) ?: elapsed(nowMs)

        fun toggled(nowMs: Long): Effort =
            if (runningSinceMs == null) {
                copy(runningSinceMs = nowMs)
            } else {
                copy(accumulatedMs = elapsedMs(nowMs), runningSinceMs = null)
            }

        fun phase(nowMs: Long): TimerPhase {
            val left = remaining(nowMs)
            return if (left == null) {
                if (running) TimerPhase.RUNNING else TimerPhase.IDLE
            } else if (left <= 0) {
                TimerPhase.OVERTIME
            } else if (left <= WARNING_SECONDS) {
                TimerPhase.WARNING
            } else if (running) {
                TimerPhase.RUNNING
            } else {
                TimerPhase.IDLE
            }
        }

        /** Start / Stop / Resume, as the button reads. */
        fun primaryLabel(nowMs: Long): String =
            if (running) {
                "Stop"
            } else if (elapsed(nowMs) == 0) {
                "Start"
            } else {
                "Resume"
            }
    }
}

enum class TimerPhase { IDLE, RUNNING, WARNING, OVERTIME }

const val WARNING_SECONDS = 10

private fun phaseOf(
    remaining: Int,
    running: Boolean,
): TimerPhase =
    if (remaining <= 0) {
        TimerPhase.OVERTIME
    } else if (remaining <= WARNING_SECONDS) {
        TimerPhase.WARNING
    } else if (running) {
        TimerPhase.RUNNING
    } else {
        TimerPhase.IDLE
    }

/** A sound the timer asks for (`rest-alarm.ts`). */
enum class Cue { TICK, CHIME_START, CHIME_STOP }

/**
 * Turns a timer observed over time into sounds: a tick each second from 10 to 1,
 * and a chime that starts at zero and repeats until the timer is stopped.
 */
class CueTracker {
    private var key: Any? = null
    private var last: Int? = null
    private var chiming = false

    fun update(
        timer: WorkoutTimer?,
        nowMs: Long,
    ): List<Cue> {
        val countdown =
            when (timer) {
                is WorkoutTimer.Rest -> timer.remaining(nowMs)
                is WorkoutTimer.Effort -> if (timer.running) timer.remaining(nowMs) else null
                null -> null
            }
        val identity =
            when (timer) {
                is WorkoutTimer.Rest -> "rest"
                is WorkoutTimer.Effort -> if (timer.running) timer.runningSinceMs else null
                null -> null
            }
        val cues = mutableListOf<Cue>()
        if (identity != key) {
            if (chiming && (countdown == null || timer is WorkoutTimer.Effort)) {
                cues += Cue.CHIME_STOP
                chiming = false
            }
            key = identity
            last = null
        }
        if (countdown != null && countdown != last) {
            if (countdown <= 0 && !chiming) {
                cues += Cue.CHIME_START
                chiming = true
            } else if (countdown in 1..WARNING_SECONDS) {
                cues += Cue.TICK
            }
            last = countdown
        }
        return cues
    }
}
