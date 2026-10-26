package net.prussin.titan.core.reminder

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime

class WeighInReminderTest {
    private val zone = ZoneId.of("America/Los_Angeles")
    private val settings = ReminderSettings()

    private fun at(
        day: Int,
        hour: Int,
    ) = ZonedDateTime.of(2026, 10, day, hour, 0, 0, 0, zone)

    @Test
    fun `fires at seven today when it's still ahead`() {
        assertEquals(at(26, 7), nextReminder(settings, at(26, 5), weighedInOn = { false }))
    }

    @Test
    fun `skips today once weighed in or once past`() {
        assertEquals(at(27, 7), nextReminder(settings, at(26, 5), weighedInOn = { it == LocalDate.of(2026, 10, 26) }))
        assertEquals(at(27, 7), nextReminder(settings, at(26, 8), weighedInOn = { false }))
    }

    @Test
    fun `honors a custom time and the off switch`() {
        assertEquals(
            ZonedDateTime.of(2026, 10, 26, 6, 30, 0, 0, zone),
            nextReminder(ReminderSettings(hour = 6, minute = 30), at(26, 5), weighedInOn = { false }),
        )
        assertNull(nextReminder(settings.copy(enabled = false), at(26, 5), weighedInOn = { false }))
        assertFalse(shouldRemind(at(26, 7), weighedInOn = { true }))
    }
}
