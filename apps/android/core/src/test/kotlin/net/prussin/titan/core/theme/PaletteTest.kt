package net.prussin.titan.core.theme

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class PaletteTest {
    @Test
    fun `mixes in oklab like the browser`() {
        assertEquals(0xFF0A0A0B, mix(0xFFF2F1EF, 0.0, 0xFF0A0A0B))
        assertEquals(0xFFF2F1EF, mix(0xFFF2F1EF, 1.0, 0xFF0A0A0B))
        // Values Chromium computes for the same `color-mix(in oklab, …)`.
        assertEquals(0xFF5E5D5C, mix(0xFFF2F1EF, 0.5, 0xFF000000))
    }

    @Test
    fun `derives tokens from the primitives`() {
        val dark = Palette.of(TitanPalettes.Dark)
        assertEquals(0xFF2C2C2C, dark.border)
        assertEquals(0xFF7E7E7D, dark.muted)
        assertEquals(0x80123456L, withAlpha(0xFF123456, 0.5) and 0xFFFFFFFFL)
    }
}
