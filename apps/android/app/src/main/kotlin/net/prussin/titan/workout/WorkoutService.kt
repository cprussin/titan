package net.prussin.titan.workout

import android.app.ForegroundServiceStartNotAllowedException
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioManager
import android.os.IBinder
import android.os.PowerManager
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import net.prussin.titan.MainActivity
import net.prussin.titan.R
import net.prussin.titan.TitanApp
import net.prussin.titan.core.format.describePrescription
import net.prussin.titan.core.format.formatSignedClock
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.workout.CueTracker
import net.prussin.titan.core.workout.TimerPhase
import net.prussin.titan.core.workout.WorkoutRun
import net.prussin.titan.core.workout.WorkoutTimer

/**
 * Keeps a workout alive outside the app: a promoted, ongoing notification with
 * the progress through the session and the one live timer (with the page's own
 * buttons), and the countdown ticks and end chime, which keep sounding with the
 * screen off.
 */
class WorkoutService : Service() {
    private val scope = MainScope()
    private val tracker = CueTracker()
    private lateinit var synth: ToneSynth
    private lateinit var wakeLock: PowerManager.WakeLock
    private val controller get() = (application as TitanApp).graph.workout

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        synth = ToneSynth(scope, getSystemService(AudioManager::class.java))
        wakeLock =
            getSystemService(PowerManager::class.java)
                .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "titan:workout-timer")
                .apply { setReferenceCounted(false) }
        ensureChannel(this)
        startForeground(
            NOTIFICATION_ID,
            build(controller.run.value, System.currentTimeMillis()),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
        )
        scope.launch { controller.run.collectLatest { follow(it) } }
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int,
    ): Int {
        val now = System.currentTimeMillis()
        when (intent?.action) {
            ACTION_ADD_REST -> controller.update { it.addRest(30) }
            ACTION_STOP_REST -> controller.update { it.stopRest() }
            ACTION_TOGGLE_EFFORT -> controller.update { it.toggleEffort(now) }
            ACTION_USE_EFFORT -> controller.update { it.useEffortTime(now) }
            ACTION_RESET_EFFORT -> controller.update { it.resetEffort() }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        synth.release()
        if (wakeLock.isHeld) wakeLock.release()
        super.onDestroy()
    }

    /** Sound cues and refresh the notification each second a timer is live. */
    private suspend fun follow(run: WorkoutRun?) {
        if (run == null) {
            synth.stop()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return
        }
        val live = run.timer.let { it is WorkoutTimer.Rest || (it is WorkoutTimer.Effort && it.running) }
        if (live) {
            wakeLock.acquire(WAKE_LIMIT_MS)
        } else if (wakeLock.isHeld) {
            wakeLock.release()
        }
        var shown: Any? = Any()
        while (true) {
            val now = System.currentTimeMillis()
            tracker.update(run.timer, now).forEach(synth::play)
            val phase = phaseOf(run.timer, now)
            if (phase != shown) {
                notify(build(run, now))
                shown = phase
            }
            if (!live) break
            delay(1_000 - Math.floorMod(now - anchorOf(run.timer), 1_000L))
        }
    }

    private fun notify(notification: Notification) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    }

    private fun build(
        run: WorkoutRun?,
        now: Long,
    ): Notification {
        val builder =
            Notification
                .Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_notification)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_WORKOUT)
                .setColor(ACCENT)
                .setContentIntent(openApp(this, MainActivity.OPEN_WORKOUT))
                .setRequestPromotedOngoing(true)
        val exercise = run?.current
        if (run == null || exercise == null) {
            return builder.setContentTitle("Workout").build()
        }
        val total = run.prescribed.size
        builder
            .setContentTitle(run.name(exercise))
            .setSubText("Exercise ${run.index + 1} of $total")
            .setStyle(
                Notification
                    .ProgressStyle()
                    .setStyledByProgress(true)
                    .setProgressSegments(List(total) { Notification.ProgressStyle.Segment(1).setColor(ACCENT) })
                    .setProgress(run.index),
            )
        when (val timer = run.timer) {
            is WorkoutTimer.Rest -> {
                builder
                    .setContentText(if (timer.remaining(now) > 0) "Rest" else "Rest · over time")
                    .setUsesChronometer(true)
                    .setChronometerCountDown(true)
                    .setWhen(timer.endsAtMs)
                    .setShortCriticalText("Rest")
                    .addAction(action("+30s", ACTION_ADD_REST))
                    .addAction(action("Stop", ACTION_STOP_REST))
            }

            else -> {
                val effort = run.effort
                builder.setContentText(describe(run))
                if (effort != null) {
                    if (effort.running) {
                        builder
                            .setUsesChronometer(true)
                            .setChronometerCountDown(effort.targetSec != null)
                            .setWhen(
                                effort.targetSec?.let { now + it * 1_000L - effort.elapsedMs(now) }
                                    ?: (now - effort.elapsedMs(now)),
                            ).setShortCriticalText("Timer")
                    } else {
                        builder.setShowWhen(false).setShortCriticalText(formatSignedClock(effort.display(now)))
                    }
                    builder.addAction(action(effort.primaryLabel(now), ACTION_TOGGLE_EFFORT))
                    if (!effort.running && effort.elapsed(now) > 0) {
                        builder
                            .addAction(action("Use time", ACTION_USE_EFFORT))
                            .addAction(action("Reset", ACTION_RESET_EFFORT))
                    }
                } else {
                    builder.setShowWhen(false)
                }
            }
        }
        return builder.build()
    }

    private fun describe(run: WorkoutRun): String {
        val exercise = run.current ?: return ""
        val prescription = exercise.prescription
        val target = describePrescription(prescription)
        return if (prescription is Prescription.SetBased) {
            val done = run.logged.size
            if (done >=
                prescription.sets
            ) {
                "All sets logged · $target"
            } else {
                "Set ${done + 1} of ${prescription.sets} · $target"
            }
        } else {
            target
        }
    }

    private fun action(
        label: String,
        action: String,
    ): Notification.Action =
        Notification.Action
            .Builder(
                null,
                label,
                PendingIntent.getService(
                    this,
                    action.hashCode(),
                    Intent(this, WorkoutService::class.java).setAction(action),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
                ),
            ).build()

    companion object {
        private const val CHANNEL = "workout"
        private const val NOTIFICATION_ID = 1
        private const val ACCENT = 0xFF3D7BFF.toInt()
        private const val WAKE_LIMIT_MS = 4 * 60 * 60 * 1000L
        private const val ACTION_ADD_REST = "net.prussin.titan.ADD_REST"
        private const val ACTION_STOP_REST = "net.prussin.titan.STOP_REST"
        private const val ACTION_TOGGLE_EFFORT = "net.prussin.titan.TOGGLE_EFFORT"
        private const val ACTION_USE_EFFORT = "net.prussin.titan.USE_EFFORT"
        private const val ACTION_RESET_EFFORT = "net.prussin.titan.RESET_EFFORT"

        /** Start (or keep) the service; refused from the background, where the app retries on next open. */
        fun start(context: Context) {
            try {
                context.startForegroundService(Intent(context, WorkoutService::class.java))
            } catch (_: ForegroundServiceStartNotAllowedException) {
                // The activity calls this again when it comes to the foreground.
            }
        }

        fun ensureChannel(context: Context) {
            val channel =
                NotificationChannel(CHANNEL, "Workout in progress", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "Progress and timers while a workout is underway"
                    setSound(null, null)
                    enableVibration(false)
                }
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }

        fun openApp(
            context: Context,
            open: String,
        ): PendingIntent =
            PendingIntent.getActivity(
                context,
                open.hashCode(),
                Intent(context, MainActivity::class.java)
                    .putExtra(MainActivity.EXTRA_OPEN, open)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )

        /** What the notification shows changes only when the phase or the run does. */
        private fun phaseOf(
            timer: WorkoutTimer?,
            now: Long,
        ): Any? =
            when (timer) {
                is WorkoutTimer.Rest -> timer.phase(now) == TimerPhase.OVERTIME
                is WorkoutTimer.Effort -> timer.phase(now)
                null -> null
            }

        private fun anchorOf(timer: WorkoutTimer?): Long =
            when (timer) {
                is WorkoutTimer.Rest -> timer.endsAtMs
                is WorkoutTimer.Effort -> (timer.runningSinceMs ?: 0) - timer.accumulatedMs
                null -> 0
            }
    }
}
