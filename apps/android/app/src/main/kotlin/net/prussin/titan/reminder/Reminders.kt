package net.prussin.titan.reminder

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import net.prussin.titan.MainActivity
import net.prussin.titan.R
import net.prussin.titan.TitanApp
import net.prussin.titan.core.reminder.localNow
import net.prussin.titan.core.reminder.nextReminder
import net.prussin.titan.core.reminder.shouldRemind
import net.prussin.titan.core.wire.BodyMetricsData
import net.prussin.titan.workout.WorkoutService
import java.time.LocalDate

/** The daily weigh-in reminder: one exact alarm, re-armed after each firing. */
object Reminders {
    private const val CHANNEL = "weigh-in"
    private const val NOTIFICATION_ID = 2

    /** Arm (or disarm) the next reminder from the current settings. */
    fun schedule(context: Context) {
        val graph = (context.applicationContext as TitanApp).graph
        val alarms = context.getSystemService(AlarmManager::class.java)
        val pending = alarmIntent(context)
        alarms.cancel(pending)
        if (!graph.session.signedIn.value) return
        val at =
            nextReminder(graph.session.reminder.value, localNow()) { day ->
                graph.session.lastWeighIn == day.toString()
            } ?: return
        alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at.toInstant().toEpochMilli(), pending)
    }

    fun ensureChannel(context: Context) {
        val channel =
            NotificationChannel(CHANNEL, "Weigh-in reminder", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "A daily nudge to log your bodyweight"
            }
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    fun clear(context: Context) {
        context.getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID)
    }

    internal fun show(context: Context) {
        ensureChannel(context)
        val open = WorkoutService.openApp(context, MainActivity.OPEN_WEIGH_IN)
        val notification =
            Notification
                .Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Time to weigh in")
                .setContentText("Log this morning's bodyweight.")
                .setCategory(Notification.CATEGORY_REMINDER)
                .setColor(0xFF3D7BFF.toInt())
                .setContentIntent(open)
                .setAutoCancel(true)
                .addAction(Notification.Action.Builder(null, "Weigh in", open).build())
                .build()
        context.getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    }

    private fun alarmIntent(context: Context): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            0,
            Intent(context, ReminderReceiver::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
}

/** The alarm went off: remind unless today's weigh-in is already logged (here or on the web). */
class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(
        context: Context,
        intent: Intent,
    ) {
        val graph = (context.applicationContext as TitanApp).graph
        val result = goAsync()
        CoroutineScope(Dispatchers.Default).launch {
            try {
                val today = LocalDate.now().toString()
                val metrics =
                    withTimeoutOrNull(8_000) {
                        graph.repository.fetch("body-metrics", BodyMetricsData.serializer()) { bodyMetrics() }
                    }
                if (metrics?.metrics?.any { it.date == today } == true) graph.session.lastWeighIn = today
                if (shouldRemind(localNow()) { it.toString() == graph.session.lastWeighIn }) Reminders.show(context)
                Reminders.schedule(context)
            } finally {
                result.finish()
            }
        }
    }
}

/** Alarms don't survive reboots, clock changes, or app updates; re-arm after each. */
class RearmReceiver : BroadcastReceiver() {
    override fun onReceive(
        context: Context,
        intent: Intent,
    ) {
        Reminders.schedule(context)
    }
}
