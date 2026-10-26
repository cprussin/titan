package net.prussin.titan.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import net.prussin.titan.R
import net.prussin.titan.core.format.Tone
import net.prussin.titan.core.theme.Palette
import net.prussin.titan.core.theme.TitanPalettes
import net.prussin.titan.core.theme.mix
import net.prussin.titan.core.theme.withAlpha

enum class ThemeMode { SYSTEM, LIGHT, DARK }

/** The preset's semantic colors, plus the derived mixes the web computes inline. */
@Immutable
data class TitanColors(
    val palette: Palette,
    val isDark: Boolean,
) {
    val accent = Color(palette.accent)
    val background = Color(palette.background)
    val danger = Color(palette.danger)
    val foreground = Color(palette.foreground)
    val success = Color(palette.success)
    val warning = Color(palette.warning)
    val border = Color(palette.border)
    val borderStrong = Color(palette.borderStrong)
    val card = Color(palette.card)
    val dangerSoft = Color(palette.dangerSoft)
    val muted = Color(palette.muted)
    val skeleton = Color(palette.skeleton)
    val surfaceDesk = Color(palette.surfaceDesk)
    val textTertiary = Color(palette.textTertiary)

    /** The `primary` button: background 80% toward foreground. */
    val primaryFill = Color(mix(palette.foreground, 0.2, palette.background))

    fun of(tone: Tone): Color =
        when (tone) {
            Tone.ACCENT -> accent
            Tone.SUCCESS -> success
            Tone.WARNING -> warning
            Tone.DANGER -> danger
            Tone.NEUTRAL -> textTertiary
        }

    /** `color-mix(in oklab, <color> <amount>, transparent)`. */
    fun alpha(
        color: Color,
        amount: Double,
    ): Color = Color(withAlpha(color.toArgbLong(), amount))

    /** The badge's tinted fill and its legible text for a tone. */
    fun badge(tone: Tone): Pair<Color, Color> =
        when (tone) {
            Tone.ACCENT -> alpha(accent, 0.15) to Color(mix(palette.accent, 0.80, palette.foreground))
            Tone.DANGER -> alpha(danger, 0.15) to Color(mix(palette.danger, 0.82, palette.foreground))
            Tone.SUCCESS -> alpha(success, 0.16) to Color(mix(palette.success, 0.80, palette.foreground))
            Tone.WARNING -> alpha(warning, 0.16) to Color(mix(palette.warning, 0.82, palette.foreground))
            Tone.NEUTRAL -> alpha(foreground, 0.08) to textTertiary
        }

    companion object {
        val Dark = TitanColors(Palette.of(TitanPalettes.Dark), isDark = true)
        val Light = TitanColors(Palette.of(TitanPalettes.Light), isDark = false)
    }
}

private fun Color.toArgbLong(): Long = toArgb().toLong() and 0xFFFFFFFF

object TitanFonts {
    val Sans =
        FontFamily(
            Font(R.font.barlow_regular, FontWeight.Normal),
            Font(R.font.barlow_medium, FontWeight.Medium),
            Font(R.font.barlow_semibold, FontWeight.SemiBold),
            Font(R.font.barlow_bold, FontWeight.Bold),
        )
    val Condensed =
        FontFamily(
            Font(R.font.barlow_condensed_regular, FontWeight.Normal),
            Font(R.font.barlow_condensed_semibold, FontWeight.SemiBold),
            Font(R.font.barlow_condensed_bold, FontWeight.Bold),
        )
    val Mono =
        FontFamily(
            Font(R.font.ibm_plex_mono_regular, FontWeight.Normal),
            Font(R.font.ibm_plex_mono_medium, FontWeight.Medium),
            Font(R.font.ibm_plex_mono_semibold, FontWeight.SemiBold),
        )
}

/** Panda's font-size scale, in sp. */
object TextSize {
    val xs = 12.sp
    val sm = 14.sp
    val md = 16.sp
    val lg = 18.sp
    val xl = 20.sp
    val x2l = 24.sp
    val x3l = 30.sp
    val x4l = 36.sp
    val x5l = 48.sp
    val x7l = 72.sp
}

/** Panda's radii. */
object Radii {
    val sm = RoundedCornerShape(4.dp)
    val md = RoundedCornerShape(6.dp)
    val lg = RoundedCornerShape(8.dp)
    val xl = RoundedCornerShape(12.dp)
    val full = RoundedCornerShape(percent = 50)
}

val LocalTitanColors = staticCompositionLocalOf { TitanColors.Dark }

object Titan {
    val colors: TitanColors
        @Composable get() = LocalTitanColors.current

    fun body(
        size: androidx.compose.ui.unit.TextUnit = TextSize.md,
        weight: FontWeight = FontWeight.Normal,
    ) = TextStyle(fontFamily = TitanFonts.Sans, fontSize = size, fontWeight = weight)

    fun condensed(
        size: androidx.compose.ui.unit.TextUnit,
        weight: FontWeight = FontWeight.Bold,
    ) = TextStyle(fontFamily = TitanFonts.Condensed, fontSize = size, fontWeight = weight, lineHeight = size * 1.05)

    fun mono(
        size: androidx.compose.ui.unit.TextUnit = TextSize.sm,
        weight: FontWeight = FontWeight.Normal,
    ) = TextStyle(fontFamily = TitanFonts.Mono, fontSize = size, fontWeight = weight)
}

@Composable
fun TitanTheme(
    mode: ThemeMode,
    content: @Composable () -> Unit,
) {
    val dark =
        when (mode) {
            ThemeMode.SYSTEM -> isSystemInDarkTheme()
            ThemeMode.LIGHT -> false
            ThemeMode.DARK -> true
        }
    val colors = if (dark) TitanColors.Dark else TitanColors.Light
    // Material components (text fields, switches, dialogs) draw from the same palette.
    val scheme =
        (if (dark) darkColorScheme() else lightColorScheme()).copy(
            primary = colors.accent,
            onPrimary = colors.background,
            secondary = colors.accent,
            onSecondary = colors.background,
            background = colors.background,
            onBackground = colors.foreground,
            surface = colors.background,
            onSurface = colors.foreground,
            surfaceVariant = colors.card,
            onSurfaceVariant = colors.muted,
            surfaceContainer = colors.card,
            surfaceContainerHigh = colors.card,
            surfaceContainerHighest = colors.card,
            surfaceContainerLow = colors.surfaceDesk,
            surfaceContainerLowest = colors.background,
            outline = colors.border,
            outlineVariant = colors.border,
            error = colors.danger,
            onError = colors.background,
        )
    val base = Titan.body()
    MaterialTheme(
        colorScheme = scheme,
        typography =
            MaterialTheme.typography.let { t ->
                t.copy(
                    bodyLarge = t.bodyLarge.merge(base),
                    bodyMedium = t.bodyMedium.merge(base.copy(fontSize = TextSize.sm)),
                    bodySmall = t.bodySmall.merge(base.copy(fontSize = TextSize.xs)),
                    labelLarge = t.labelLarge.merge(base.copy(fontSize = TextSize.sm, fontWeight = FontWeight.Medium)),
                    titleLarge = t.titleLarge.merge(Titan.condensed(TextSize.x2l)),
                    headlineSmall = t.headlineSmall.merge(Titan.condensed(TextSize.x2l)),
                )
            },
    ) {
        CompositionLocalProvider(LocalTitanColors provides colors, content = content)
    }
}
