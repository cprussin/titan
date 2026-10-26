package net.prussin.titan.core.format

import net.prussin.titan.core.wire.LoadUnit
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class FormatTest {
    @Test
    fun `formats weights to the nearest half unit`() {
        assertEquals("230 lb", formatWeight(230.0))
        assertEquals("202.5 lb", formatWeight(202.5))
        assertEquals("92.5 kg", formatWeight(92.5, LoadUnit.KG))
        assertEquals(100.0, snapWeight(99.8))
        assertEquals(102.5, snapWeight(102.4))
    }

    @Test
    fun `formats body weight to a tenth`() {
        assertEquals("172 lb", formatBodyWeight(172.0))
        assertEquals("172.4 lb", formatBodyWeight(172.4))
        assertEquals("150.3 lb", formatBodyWeight(150.25))
    }

    @Test
    fun `formats clocks, splits, and distances`() {
        assertEquals("1:30", formatClock(90))
        assertEquals("0:05", formatClock(5))
        assertEquals("-0:05", formatSignedClock(-5))
        assertEquals("-1:35", formatSignedClock(-95))
        assertEquals("0:00", formatSignedClock(0))
        assertEquals("1:45.0 /500m", formatSplit(105.0))
        assertEquals("1:52.0", formatSplitClock(112.0))
        assertEquals("2,734 m", formatDistance(2734.0))
        assertEquals("10,000 m", formatDistance(10_000.0))
        assertEquals("22 min", formatMinutes(22.4))
    }

    @Test
    fun `formats durations with tenths under ten minutes`() {
        assertEquals("45.3", formatDuration(45.3))
        assertEquals("5.0", formatDuration(5.0))
        assertEquals("7:23.4", formatDuration(443.4))
        assertEquals("1:05.0", formatDuration(65.0))
        assertEquals("40:00", formatDuration(2400.0))
        assertEquals("10:06", formatDuration(605.7))
        assertEquals("2:00.0", formatDuration(119.98))
    }

    @Test
    fun `parses m-ss or plain seconds`() {
        assertEquals(443.4, parseDuration("7:23.4"))
        assertEquals(1800.0, parseDuration("30:00"))
        assertEquals(45.3, parseDuration("45.3"))
        listOf("", "   ", "abc", "1:2:3", "6:75", "6:", ":30").forEach { assertNull(parseDuration(it), it) }
    }
}
