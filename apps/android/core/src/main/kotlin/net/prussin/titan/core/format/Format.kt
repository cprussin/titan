package net.prussin.titan.core.format

import net.prussin.titan.core.wire.LoadUnit
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.abs
import kotlin.math.floor

// Ports of the web's `format.ts`; outputs match it character for character.

/** JavaScript's `Math.round`: halves round toward +∞ (Kotlin's `round` is half-even). */
fun jsRound(value: Double): Double = floor(value + 0.5)

/** A number as JavaScript prints it in a template string: `60`, not `60.0`. */
fun jsNumber(value: Double): String =
    if (value == floor(value) && abs(value) < 1e15) {
        value.toLong().toString()
    } else {
        value.toString()
    }

private fun fixed1(value: Double): String = String.format(Locale.US, "%.1f", value)

fun snapWeight(weight: Double): Double = jsRound(weight * 2) / 2

private fun tidy(value: Double): String {
    val rounded = snapWeight(value)
    return if (rounded == floor(rounded)) jsNumber(rounded) else fixed1(rounded)
}

fun formatWeight(
    weight: Double,
    unit: LoadUnit = LoadUnit.LB,
): String = "${tidy(weight)} ${unit.label}"

fun formatBodyWeight(weightLb: Double): String {
    val rounded = jsRound(weightLb * 10) / 10
    val text = if (rounded == floor(rounded)) jsNumber(rounded) else fixed1(rounded)
    return "$text lb"
}

fun formatMinutes(minutes: Double): String = "${jsRound(minutes).toLong()} min"

fun formatClock(totalSeconds: Int): String = formatClock(totalSeconds.toDouble())

fun formatClock(totalSeconds: Double): String {
    val minutes = floor(totalSeconds / 60).toLong()
    val seconds = maxOf(0.0, jsRound(totalSeconds - minutes * 60)).toLong()
    return "$minutes:${seconds.toString().padStart(2, '0')}"
}

fun formatSignedClock(totalSeconds: Int): String =
    if (totalSeconds < 0) "-${formatClock(-totalSeconds)}" else formatClock(totalSeconds)

fun formatSplitClock(secondsPer500: Double): String {
    val minutes = floor(secondsPer500 / 60).toLong()
    val seconds = fixed1(secondsPer500 - minutes * 60).padStart(4, '0')
    return "$minutes:$seconds"
}

fun formatSplit(secondsPer500: Double): String = "${formatSplitClock(secondsPer500)} /500m"

private val metersFormat: NumberFormat = NumberFormat.getIntegerInstance(Locale.US)

fun formatDistance(meters: Double): String = "${metersFormat.format(jsRound(meters).toLong())} m"

private const val WHOLE_SECOND_CEILING_SEC = 600

fun formatDuration(totalSeconds: Double): String {
    val scale = if (totalSeconds >= WHOLE_SECOND_CEILING_SEC) 1 else 10
    val rounded = jsRound(totalSeconds * scale) / scale
    val minutes = floor(rounded / 60).toLong()
    val seconds = rounded - minutes * 60
    val secondsText = if (scale == 10) fixed1(seconds) else jsRound(seconds).toLong().toString()
    return if (minutes == 0L) {
        secondsText
    } else {
        "$minutes:${secondsText.padStart(if (scale == 10) 4 else 2, '0')}"
    }
}

/** `m:ss(.s)` or plain seconds; `null` for anything else. */
fun parseDuration(text: String): Double? {
    val segments = text.trim().split(":")
    return when (segments.size) {
        1 -> {
            toNonNegative(segments[0])
        }

        2 -> {
            val minutes = toNonNegative(segments[0])
            val seconds = toNonNegative(segments[1])
            if (minutes == null || seconds == null || seconds >= 60) null else minutes * 60 + seconds
        }

        else -> {
            null
        }
    }
}

private fun toNonNegative(text: String): Double? {
    val trimmed = text.trim()
    val value = if (trimmed.isEmpty()) null else trimmed.toDoubleOrNull()
    return if (value != null && value.isFinite() && value >= 0) value else null
}

/** The stepper input's parse: a finite, non-negative number or `null`. */
fun parseFieldValue(raw: String): Double? = toNonNegative(raw)
