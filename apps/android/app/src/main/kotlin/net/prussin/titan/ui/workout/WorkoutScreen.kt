package net.prussin.titan.ui.workout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.VerticalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import net.prussin.titan.R
import net.prussin.titan.core.format.describePrescription
import net.prussin.titan.core.format.describePreviousPerformance
import net.prussin.titan.core.format.loggedExerciseLines
import net.prussin.titan.core.format.prescriptionParts
import net.prussin.titan.core.format.roleTone
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.workout.WorkoutRun
import net.prussin.titan.core.workout.WorkoutTimer
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.LocalNavigator
import net.prussin.titan.ui.LocalWide
import net.prussin.titan.ui.Route
import net.prussin.titan.ui.components.Badge
import net.prussin.titan.ui.components.ConfirmDialog
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanDialog
import net.prussin.titan.ui.components.TopBar
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.screens.ConflictDialog
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

/** The workout underway (`WorkoutExecution`). */
@Composable
fun WorkoutScreen(route: Route.Workout) {
    val graph = LocalGraph.current
    val navigator = LocalNavigator.current
    val controller = graph.workout
    val run by controller.run.collectAsState()
    val conflict by controller.conflict.collectAsState()
    var missing by remember(route.sessionId) { mutableStateOf(false) }
    LaunchedEffect(route.sessionId) {
        val resolved = controller.resolve(route.sessionId)
        if (resolved != route.sessionId) navigator.replace(Route.Workout(resolved))
        if (run?.sessionId != resolved && !controller.open(resolved)) missing = true
    }
    var cancelling by remember { mutableStateOf(false) }
    val active = run?.takeIf { it.sessionId == route.sessionId }
    Column(Modifier.fillMaxSize().imePadding()) {
        TopBar("Current Workout", icon = R.drawable.ph_barbell) {
            if (active !=
                null
            ) {
                TitanButton(
                    "Cancel workout",
                    { cancelling = true },
                    variant = Variant.DANGER,
                    size = ControlSize.SM,
                )
            }
        }
        when {
            active != null -> {
                Body(active)
            }

            missing -> {
                Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    MutedText("This workout isn't on this phone, and the server can't be reached.", size = TextSize.md)
                    TitanButton("Back", { navigator.pop() }, variant = Variant.OUTLINE)
                }
            }

            else -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Titan.colors.accent, modifier = Modifier.size(28.dp))
                }
            }
        }
    }
    if (cancelling) {
        ConfirmDialog(
            title = "Cancel workout?",
            text =
                "This discards everything you’ve logged in this session and returns to today’s plan. " +
                    "It can’t be undone.",
            cancelLabel = "Keep going",
            confirmLabel = "Cancel workout",
            onDismiss = { cancelling = false },
            onConfirm = {
                controller.cancel()
                navigator.reset(Route.Dashboard())
            },
        )
    }
    conflict?.let { ConflictDialog() }
}

@Composable
private fun Body(run: WorkoutRun) {
    val wide = LocalWide.current
    val c = Titan.colors
    Column(Modifier.fillMaxSize()) {
        ProgressBar(run)
        Row(Modifier.weight(1f)) {
            Column(Modifier.weight(1.6f)) {
                Column(
                    Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Main(run, showOverviewButton = !wide)
                }
                Bar(run)
            }
            if (wide) {
                VerticalDivider(color = c.border)
                Column(
                    Modifier
                        .weight(1f)
                        .background(c.surfaceDesk)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Eyebrow("Session")
                    Overview(run)
                }
            }
        }
    }
}

@Composable
private fun Main(
    run: WorkoutRun,
    showOverviewButton: Boolean,
) {
    val controller = LocalGraph.current.workout
    val c = Titan.colors
    val exercise = run.current
    if (exercise == null) {
        NothingToLog()
        return
    }
    var overview by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Badge(exercise.role, roleTone(exercise.role))
        Text(run.name(exercise), style = Titan.condensed(TextSize.x3l), color = c.foreground)
        val parts = prescriptionParts(exercise.prescription)
        Text(parts.primary, style = Titan.mono(TextSize.lg), color = c.muted)
        parts.recovery?.let { Text(it, style = Titan.mono(TextSize.sm), color = c.textTertiary) }
    }
    exercise.previous?.let(::describePreviousPerformance)?.let {
        Text("Last time: $it", style = Titan.body(TextSize.sm), color = c.muted)
    }
    run.explanations[exercise.exerciseId]?.let { Text(it, style = Titan.body(TextSize.sm), color = c.textTertiary) }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            run.next?.let { "Next: ${run.name(it)} · ${describePrescription(it.prescription)}" } ?: "",
            Modifier.weight(1f),
            style = Titan.body(TextSize.sm),
            color = c.muted,
        )
        if (showOverviewButton) {
            TitanButton("Overview", {
                overview = true
            }, variant = Variant.OUTLINE, size = ControlSize.SM, icon = R.drawable.ph_list_checks)
        }
    }
    when (val timer = run.timer) {
        is WorkoutTimer.Rest -> {
            RestTimerView(
                timer,
                onAdd = { controller.update { it.addRest(30) } },
                onStop = { controller.update { it.stopRest() } },
            )
        }

        else -> {
            when (val prescription = exercise.prescription) {
                is Prescription.SetBased -> StrengthFields(run, prescription, controller)
                else -> CardioFields(run, controller)
            }
        }
    }
    if (overview) {
        TitanDialog("Workout overview", onDismiss = { overview = false }, actions = {
            TitanButton("Close", { overview = false }, variant = Variant.GHOST)
        }) {
            Column(Modifier.verticalScroll(rememberScrollState())) { Overview(run) }
        }
    }
}

@Composable
private fun Bar(run: WorkoutRun) {
    val controller = LocalGraph.current.workout
    val exercise = run.current ?: return
    if (run.timer is WorkoutTimer.Rest) return
    Column(Modifier.fillMaxWidth().background(Titan.colors.background)) {
        HorizontalDivider(color = Titan.colors.border)
        Box(Modifier.padding(12.dp)) {
            when (val prescription = exercise.prescription) {
                is Prescription.SetBased -> StrengthBar(run, prescription, controller)
                else -> CardioBar(controller)
            }
        }
    }
}

/** One segment per exercise, accent through the current one. */
@Composable
private fun ProgressBar(run: WorkoutRun) {
    val c = Titan.colors
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        run.prescribed.forEachIndexed { i, _ ->
            Box(
                Modifier
                    .weight(1f)
                    .height(4.dp)
                    .background(if (i <= run.index) c.accent else c.border, Radii.full),
            )
        }
    }
}

/** The session at a glance (`WorkoutOverview`): each exercise, its target, and what's logged. */
@Composable
private fun Overview(run: WorkoutRun) {
    val c = Titan.colors
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        run.prescribed.forEachIndexed { position, exercise ->
            val state = position.compareTo(run.index)
            val lines =
                when {
                    state < 0 -> {
                        run.results.getOrNull(position)?.let { r ->
                            loggedExerciseLines(
                                r.prescription,
                                r.sets,
                                r.cardio,
                            ).zip(r.sets.map { it.rpe } + List(8) { null })
                        }
                    }

                    state == 0 -> {
                        loggedExerciseLines(exercise.prescription, run.logged, null).zip(run.logged.map { it.rpe })
                    }

                    else -> {
                        null
                    }
                }.orEmpty()
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    Modifier
                        .size(24.dp)
                        .background(
                            when {
                                state < 0 -> c.alpha(c.success, 0.16)
                                state == 0 -> c.accent
                                else -> c.alpha(c.foreground, 0.08)
                            },
                            Radii.full,
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "${position + 1}",
                        style = Titan.mono(TextSize.xs, FontWeight.SemiBold),
                        color =
                            when {
                                state < 0 -> c.success
                                state == 0 -> c.background
                                else -> c.muted
                            },
                    )
                }
                Column(Modifier.widthIn(max = 480.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        run.name(exercise),
                        style = Titan.body(TextSize.md, FontWeight.SemiBold),
                        color = if (state > 0) c.muted else c.foreground,
                    )
                    Text(describePrescription(exercise.prescription), style = Titan.mono(TextSize.xs), color = c.muted)
                    lines.forEach { (line, rpe) ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(line.label, style = Titan.body(TextSize.xs), color = c.textTertiary)
                            Text(line.value, style = Titan.mono(TextSize.xs), color = c.foreground)
                            rpe?.let {
                                Text(
                                    "RPE ${net.prussin.titan.core.format.jsNumber(it)}",
                                    style = Titan.mono(TextSize.xs),
                                    color = c.muted,
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
