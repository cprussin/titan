package net.prussin.titan.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import net.prussin.titan.R
import net.prussin.titan.core.api.WeighInBody
import net.prussin.titan.core.format.formatBodyWeight
import net.prussin.titan.core.format.parseFieldValue
import net.prussin.titan.core.sync.OutboxOp
import net.prussin.titan.core.wire.BodyMetricsData
import net.prussin.titan.reminder.Reminders
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.LocalNavigator
import net.prussin.titan.ui.Route
import net.prussin.titan.ui.components.ConfirmDialog
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.SectionTitle
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanDialog
import net.prussin.titan.ui.components.TitanIconButton
import net.prussin.titan.ui.components.TitanTextField
import net.prussin.titan.ui.components.ToggleGroup
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.components.rememberResource
import net.prussin.titan.ui.formatCalendarDate
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan
import net.prussin.titan.ui.today
import net.prussin.titan.workout.Readiness
import java.io.IOException
import java.util.UUID

/** Log today's bodyweight and review past weigh-ins (`WeighInDialog`). */
@Composable
fun WeighInDialog(onDismiss: () -> Unit) {
    val graph = LocalGraph.current
    val scope = rememberCoroutineScope()
    var text by remember { mutableStateOf("") }
    val weight = parseFieldValue(text)?.takeIf { it > 0 }
    val history = rememberResource("body-metrics", BodyMetricsData.serializer()) { bodyMetrics() }
    var deleting by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    TitanDialog(
        title = "Log weigh-in",
        onDismiss = onDismiss,
        actions = { TitanButton("Close", onDismiss, variant = Variant.GHOST) },
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TitanTextField(text, { text = it }, "Bodyweight (lb)", Modifier.weight(1f), keyboard = KeyboardType.Decimal)
            TitanButton(
                "Log",
                {
                    val day = today()
                    scope.launch {
                        graph.outbox.append(
                            listOf(OutboxOp.WeighIn(WeighInBody(UUID.randomUUID().toString(), day, weight!!))),
                        )
                        graph.session.lastWeighIn = day
                        Reminders.clear(graph.context)
                        Reminders.schedule(graph.context)
                        graph.sync.syncNow()
                    }
                    onDismiss()
                },
                variant = Variant.ACCENT,
                size = ControlSize.LG,
                enabled = weight != null,
            )
        }
        HorizontalDivider(color = Titan.colors.border)
        SectionTitle("Past weigh-ins")
        Column(Modifier.heightIn(max = 280.dp).verticalScroll(rememberScrollState())) {
            val metrics = history.value?.metrics
            when {
                metrics == null && history.status == net.prussin.titan.data.LoadStatus.LOADING -> {
                    MutedText("Reading your weigh-ins…")
                }

                metrics == null -> {
                    MutedText("Couldn’t load your weigh-in history.")
                }

                metrics.isEmpty() -> {
                    MutedText("No weigh-ins logged yet.")
                }

                else -> {
                    metrics.forEach { metric ->
                        Row(
                            Modifier.fillMaxWidth().padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                formatCalendarDate(metric.date),
                                Modifier.weight(1f),
                                style = Titan.body(TextSize.sm),
                                color = Titan.colors.muted,
                            )
                            Text(
                                formatBodyWeight(metric.weightLb),
                                style = Titan.mono(TextSize.sm),
                                color = Titan.colors.foreground,
                            )
                            TitanIconButton(
                                R.drawable.ph_trash,
                                "Delete weigh-in",
                                { deleting = metric.id },
                                size = ControlSize.SM,
                            )
                        }
                    }
                }
            }
        }
        error?.let { Text(it, style = Titan.body(TextSize.sm), color = Titan.colors.danger) }
    }
    deleting?.let { id ->
        ConfirmDialog(
            title = "Delete this weigh-in?",
            text = "It's removed from your history and trends.",
            cancelLabel = "Keep",
            confirmLabel = "Delete",
            onDismiss = { deleting = null },
            onConfirm = {
                scope.launch {
                    error = online { graph.api.deleteBodyMetric(id) }
                    graph.repository.invalidate()
                }
            },
        )
    }
}

/** Runs a server-only change; returns the message to show if it couldn't happen. */
suspend fun online(action: suspend () -> Unit): String? =
    try {
        action()
        null
    } catch (_: IOException) {
        "You're offline — try again once you're connected."
    } catch (_: net.prussin.titan.core.api.HttpException) {
        "That didn't work. Please try again."
    }

/** "Ready to train?" — pick the session and check in, then start (`StartWorkout`, `FillWorkout`). */
@Composable
fun StartWorkoutDialog(
    request: StartRequest,
    onDismiss: () -> Unit,
    onStarted: (String) -> Unit,
) {
    val graph = LocalGraph.current
    val scope = rememberCoroutineScope()
    var alternative by remember { mutableStateOf(request.alternatives.firstOrNull()?.id) }
    var readiness by remember { mutableStateOf(Readiness()) }
    var minutes by remember { mutableStateOf("60") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var confirmedFill by remember { mutableStateOf(!request.fill) }
    if (!confirmedFill) {
        TitanDialog(
            title = "Log missed workout?",
            onDismiss = onDismiss,
            actions = {
                TitanButton("Cancel", onDismiss, variant = Variant.GHOST)
                TitanButton("Start logging", { confirmedFill = true }, variant = Variant.ACCENT)
            },
        ) {
            MutedText(
                "Record this session as done on its scheduled day. Its loads count toward your progression like any other.",
                size = TextSize.md,
            )
        }
        return
    }

    fun start(withReadiness: Boolean) {
        busy = true
        error = null
        scope.launch {
            val checkIn =
                readiness.copy(availableMinutes = minutes.toIntOrNull() ?: 60).takeIf {
                    withReadiness &&
                        !request.fill
                }
            val id = graph.workout.start(request.date, alternative, checkIn)
            busy = false
            if (id == null) {
                error = "Couldn't start: you're offline and this day's plan isn't saved on this phone yet."
            } else {
                onStarted(id)
            }
        }
    }
    TitanDialog(
        title = if (request.fill) "Log workout" else "Ready to train?",
        onDismiss = onDismiss,
        actions = {
            if (!request.fill) TitanButton("Skip", { start(false) }, variant = Variant.GHOST, enabled = !busy)
            TitanButton(if (request.fill) "Start logging" else "Start workout", {
                start(true)
            }, variant = Variant.ACCENT, loading = busy)
        },
    ) {
        Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            if (request.alternatives.size > 1) {
                Eyebrow("Today's session")
                ToggleGroup(request.alternatives.map { it.id to it.label }, alternative ?: "", { alternative = it })
                MutedText("Equivalent ways to get the same session in — pick whichever suits today.")
            }
            if (!request.fill) {
                MutedText("A quick pre-workout check-in, recorded with today's session. Skip to start right away.")
                Rating("Energy", readiness.energy) { readiness = readiness.copy(energy = it) }
                Rating("Soreness (5 = fresh)", readiness.soreness) { readiness = readiness.copy(soreness = it) }
                Rating("Sleep quality", readiness.sleepQuality) { readiness = readiness.copy(sleepQuality = it) }
                TitanTextField(
                    minutes,
                    { minutes = it.filter(Char::isDigit) },
                    "Available time (min)",
                    keyboard = KeyboardType.Number,
                )
            }
            error?.let { Text(it, style = Titan.body(TextSize.sm), color = Titan.colors.danger) }
        }
    }
}

@Composable
private fun Rating(
    label: String,
    value: Int,
    onChange: (Int) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = Titan.body(TextSize.sm), color = Titan.colors.foreground)
        ToggleGroup((1..5).map { it to it.toString() }, value, onChange, Modifier.fillMaxWidth())
    }
}

/** The server closed this session while the phone still had it open. */
@Composable
fun ConflictDialog() {
    val graph = LocalGraph.current
    val navigator = LocalNavigator.current
    TitanDialog(
        title = "Workout closed elsewhere",
        onDismiss = {},
        actions = {
            TitanButton("OK", {
                graph.workout.dismissConflict()
                navigator.reset(Route.Dashboard())
            }, variant = Variant.ACCENT)
        },
    ) {
        MutedText(
            "This workout was already finished or cancelled on another device, so what you logged here since couldn't be saved.",
            size = TextSize.md,
        )
    }
}
