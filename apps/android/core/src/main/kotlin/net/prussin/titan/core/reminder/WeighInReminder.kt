package net.prussin.titan.core.reminder

import kotlinx.serialization.Serializable
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime

/** The daily weigh-in reminder's settings; device-local, never synced. */
@Serializable
data class ReminderSettings(
    val enabled: Boolean = true,
    val hour: Int = 7,
    val minute: Int = 0,
) {
    val time: LocalTime get() = LocalTime.of(hour, minute)
}

/**
 * When the reminder next fires: today at the set time if that's still ahead
 * and there's no weigh-in yet today, otherwise tomorrow. `null` when disabled.
 */
fun nextReminder(
    settings: ReminderSettings,
    now: ZonedDateTime,
    weighedInOn: (LocalDate) -> Boolean,
): ZonedDateTime? =
    if (!settings.enabled) {
        null
    } else {
        val today = now.toLocalDate()
        val todayAt = ZonedDateTime.of(today, settings.time, now.zone)
        if (todayAt.isAfter(now) &&
            !weighedInOn(today)
        ) {
            todayAt
        } else {
            ZonedDateTime.of(today.plusDays(1), settings.time, now.zone)
        }
    }

/** Whether a reminder firing now should actually show (no weigh-in yet today). */
fun shouldRemind(
    now: ZonedDateTime,
    weighedInOn: (LocalDate) -> Boolean,
): Boolean = !weighedInOn(now.toLocalDate())

fun localNow(zone: ZoneId = ZoneId.systemDefault()): ZonedDateTime = ZonedDateTime.now(zone)
