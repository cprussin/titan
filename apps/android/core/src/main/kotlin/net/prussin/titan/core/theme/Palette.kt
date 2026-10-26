package net.prussin.titan.core.theme

import kotlin.math.cbrt
import kotlin.math.pow
import kotlin.math.roundToInt

/** A theme's primitive colors, as `0xAARRGGBB`, generated from the Panda preset. */
data class Primitives(
    val accent: Long,
    val background: Long,
    val danger: Long,
    val foreground: Long,
    val success: Long,
    val warning: Long,
)

/** Every color token the web's components use, derived from [Primitives] as the preset derives them. */
data class Palette(
    val accent: Long,
    val background: Long,
    val danger: Long,
    val foreground: Long,
    val success: Long,
    val warning: Long,
    val border: Long,
    val borderStrong: Long,
    val card: Long,
    val dangerSoft: Long,
    val muted: Long,
    val skeleton: Long,
    val surfaceDesk: Long,
    val textTertiary: Long,
) {
    companion object {
        fun of(p: Primitives): Palette =
            Palette(
                accent = p.accent,
                background = p.background,
                danger = p.danger,
                foreground = p.foreground,
                success = p.success,
                warning = p.warning,
                border = mix(p.foreground, 0.18, p.background),
                borderStrong = mix(p.foreground, 0.25, p.background),
                card = mix(p.foreground, 0.06, p.background),
                dangerSoft = mix(p.danger, 0.70, p.background),
                muted = mix(p.foreground, 0.55, p.background),
                skeleton = mix(p.foreground, 0.25, p.background),
                surfaceDesk = mix(p.foreground, 0.03, p.background),
                textTertiary = mix(p.foreground, 0.38, p.background),
            )
    }
}

/** `color-mix(in oklab, a <amount>, b)` for opaque colors. */
fun mix(
    a: Long,
    amount: Double,
    b: Long,
): Long {
    val x = toOklab(a)
    val y = toOklab(b)
    return fromOklab(DoubleArray(3) { x[it] * amount + y[it] * (1 - amount) })
}

/** `color-mix(in oklab, color <amount>, transparent)`: the color at that alpha. */
fun withAlpha(
    color: Long,
    amount: Double,
): Long = ((amount * 255).roundToInt().toLong() shl 24) or (color and 0xFFFFFF)

private fun channel(
    color: Long,
    shift: Int,
): Double = ((color shr shift) and 0xFF) / 255.0

private fun toLinear(c: Double): Double = if (c <= 0.04045) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)

private fun toSrgb(c: Double): Double = if (c <= 0.0031308) c * 12.92 else 1.055 * c.pow(1 / 2.4) - 0.055

private fun toOklab(color: Long): DoubleArray {
    val r = toLinear(channel(color, 16))
    val g = toLinear(channel(color, 8))
    val b = toLinear(channel(color, 0))
    val l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    val m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    val s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return doubleArrayOf(
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )
}

private fun fromOklab(lab: DoubleArray): Long {
    val l = (lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2]).pow(3)
    val m = (lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2]).pow(3)
    val s = (lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2]).pow(3)
    val r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    val g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    val b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    fun byte(c: Double): Long = (toSrgb(c).coerceIn(0.0, 1.0) * 255).roundToInt().toLong()
    return (0xFFL shl 24) or (byte(r) shl 16) or (byte(g) shl 8) or byte(b)
}
