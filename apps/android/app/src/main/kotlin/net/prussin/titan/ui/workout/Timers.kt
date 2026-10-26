package net.prussin.titan.ui.workout

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import net.prussin.titan.core.format.formatClock
import net.prussin.titan.core.format.formatSignedClock
import net.prussin.titan.core.theme.mix
import net.prussin.titan.core.workout.TimerPhase
import net.prussin.titan.core.workout.WorkoutTimer
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

/** Wall-clock milliseconds, ticking while [live]. */
@Composable
fun rememberNow(live: Boolean): Long {
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(live) {
        now = System.currentTimeMillis()
        while (live) {
            delay(200)
            now = System.currentTimeMillis()
        }
    }
    return now
}

@Composable
private fun pulse(on: Boolean): Float {
    if (!on) return 1f
    val transition = rememberInfiniteTransition(label = "pulse")
    val alpha by transition.animateFloat(1f, 0.4f, infiniteRepeatable(tween(750), RepeatMode.Reverse), label = "alpha")
    return alpha
}

/** `color-mix(in oklab, <color> <amount>, background)`. */
@Composable
private fun wash(
    color: Color,
    amount: Double,
): Color {
    val c = Titan.colors
    return Color(mix(color.toArgb().toLong() and 0xFFFFFFFF, amount, c.palette.background))
}

/** Rest between sets (`RestTimer`): counts past zero into overtime. */
@Composable
fun RestTimerView(
    rest: WorkoutTimer.Rest,
    onAdd: () -> Unit,
    onStop: () -> Unit,
) {
    val c = Titan.colors
    val now = rememberNow(true)
    val phase = rest.phase(now)
    val fill = if (phase == TimerPhase.OVERTIME) wash(c.danger, 0.40) else wash(c.accent, 0.14)
    Column(
        Modifier.fillMaxWidth().background(fill, Radii.xl).padding(vertical = 24.dp, horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Eyebrow("Rest", color = c.foreground)
        Text(
            formatSignedClock(rest.remaining(now)),
            Modifier.alpha(pulse(phase == TimerPhase.WARNING || phase == TimerPhase.OVERTIME)),
            style = Titan.mono(TextSize.x7l, FontWeight.SemiBold),
            color = c.foreground,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TitanButton("+30s", onAdd, variant = Variant.OUTLINE, size = ControlSize.LG)
            TitanButton("Stop", onStop, variant = Variant.GHOST, size = ControlSize.LG)
        }
    }
}

/** The effort stopwatch (`EffortTimer`). */
@Composable
fun EffortTimerView(
    effort: WorkoutTimer.Effort,
    onToggle: () -> Unit,
    onUse: () -> Unit,
    onReset: () -> Unit,
) {
    val c = Titan.colors
    val now = rememberNow(effort.running)
    val phase = effort.phase(now)
    val fill =
        when (phase) {
            TimerPhase.IDLE -> wash(c.accent, 0.08)
            TimerPhase.RUNNING, TimerPhase.WARNING -> wash(c.accent, 0.16)
            TimerPhase.OVERTIME -> wash(c.danger, 0.40)
        }
    val remaining = effort.remaining(now)
    Column(
        Modifier.fillMaxWidth().background(fill, Radii.xl).padding(vertical = 16.dp, horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Eyebrow("Timer", color = c.foreground)
        Text(
            if (remaining == null) formatClock(effort.elapsed(now)) else formatSignedClock(remaining),
            Modifier.alpha(pulse(effort.running && (phase == TimerPhase.WARNING || phase == TimerPhase.OVERTIME))),
            style = Titan.mono(TextSize.x5l, FontWeight.SemiBold),
            color = c.foreground,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TitanButton(
                effort.primaryLabel(now),
                onToggle,
                variant = if (effort.running) Variant.OUTLINE else Variant.ACCENT,
                size = ControlSize.LG,
            )
            if (!effort.running && effort.elapsed(now) > 0) {
                TitanButton("Use time", onUse, variant = Variant.SUCCESS, size = ControlSize.LG)
                TitanButton("Reset", onReset, variant = Variant.GHOST, size = ControlSize.LG)
            }
        }
    }
}
