package net.prussin.titan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import net.prussin.titan.R
import net.prussin.titan.core.format.Tone
import net.prussin.titan.core.format.loggedExerciseLines
import net.prussin.titan.core.wire.CompleteData
import net.prussin.titan.core.wire.HistoryData
import net.prussin.titan.data.LoadStatus
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.LocalNavigator
import net.prussin.titan.ui.Route
import net.prussin.titan.ui.components.Badge
import net.prussin.titan.ui.components.ConfirmDialog
import net.prussin.titan.ui.components.Crumb
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.PageBody
import net.prussin.titan.ui.components.SectionTitle
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanCard
import net.prussin.titan.ui.components.TopBar
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.components.pageWidth
import net.prussin.titan.ui.components.rememberResource
import net.prussin.titan.ui.components.toneOf
import net.prussin.titan.ui.formatCalendarDate
import net.prussin.titan.ui.openDetail
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

@Composable
fun HistoryScreen(selected: String?) {
    val navigator = LocalNavigator.current
    val resource = rememberResource("history", HistoryData.serializer()) { history() }
    val c = Titan.colors
    Column {
        TopBar("History", icon = R.drawable.ph_clock_counter_clockwise)
        PageBody(resource.status, resource.value != null, maxWidth = 800.dp) {
            val rows = resource.value?.rows.orEmpty()
            if (rows.isEmpty()) {
                item { MutedText("No sessions yet — start today's workout.", Modifier.pageWidth(800.dp)) }
            }
            items(rows, key = { it.id }) { row ->
                Column(Modifier.pageWidth(800.dp)) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clip(Radii.md)
                            .background(if (row.id == selected) c.alpha(c.accent, 0.12) else Color.Transparent)
                            .clickable {
                                navigator.openDetail(
                                    if (row.isComplete) Route.Complete(row.id) else Route.Workout(row.id),
                                )
                            }.padding(horizontal = 8.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(row.name, style = Titan.body(TextSize.md, FontWeight.SemiBold), color = c.foreground)
                            Text(row.meta, style = Titan.body(TextSize.sm), color = c.muted)
                        }
                        Badge(row.badge.text, toneOf(row.badge.tone))
                    }
                    HorizontalDivider(color = c.border)
                }
            }
        }
    }
}

@Composable
fun CompleteScreen(route: Route.Complete) {
    val graph = LocalGraph.current
    val navigator = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val resource =
        rememberResource("complete:${route.sessionId}", CompleteData.serializer()) { complete(route.sessionId) }
    var deleting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val data = resource.value
    Column {
        TopBar(
            data?.scheduledDate?.let(::formatCalendarDate) ?: "Workout",
            icon = R.drawable.ph_clock_counter_clockwise,
            crumbs = listOf(Crumb("History") { navigator.reset(Route.History) }),
        ) {
            if (data !=
                null
            ) {
                TitanButton("Delete workout", {
                    deleting = true
                }, variant = Variant.DANGER, size = net.prussin.titan.ui.components.ControlSize.SM)
            }
        }
        if (data == null && resource.status == LoadStatus.OFFLINE) {
            PageBody(LoadStatus.READY, true) {
                item {
                    MutedText(
                        "Workout saved on this phone. Its summary appears once it syncs.",
                        size = TextSize.md,
                    )
                }
            }
        } else {
            PageBody(resource.status, data != null, maxWidth = 800.dp) {
                if (data != null) {
                    error?.let { item { Text(it, color = Titan.colors.danger) } }
                    item {
                        Row(Modifier.pageWidth(800.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            StatTile("Duration", "${data.stats.durationMin} min", Tone.ACCENT, Modifier.weight(1f))
                            StatTile("Sets", "${data.stats.totalSets}", null, Modifier.weight(1f))
                            StatTile(
                                "PRs",
                                "${data.stats.prCount}",
                                if (data.stats.prCount >
                                    0
                                ) {
                                    Tone.SUCCESS
                                } else {
                                    null
                                },
                                Modifier.weight(1f),
                            )
                        }
                    }
                    if (data.results.isNotEmpty()) {
                        item {
                            TitanCard(Modifier.pageWidth(800.dp), title = "What you logged") {
                                data.results.forEach { result ->
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(
                                            data.exerciseNames[result.exerciseId] ?: result.exerciseId,
                                            style = Titan.body(TextSize.md, FontWeight.SemiBold),
                                            color = Titan.colors.foreground,
                                        )
                                        val lines = loggedExerciseLines(result.prescription, result.sets, result.cardio)
                                        lines.forEach { line ->
                                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                if (line.label.isNotEmpty()) {
                                                    Text(
                                                        line.label,
                                                        style = Titan.body(TextSize.sm),
                                                        color = Titan.colors.muted,
                                                    )
                                                }
                                                Text(
                                                    line.value,
                                                    style = Titan.mono(TextSize.sm),
                                                    color = Titan.colors.foreground,
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (data.personalRecords.isNotEmpty()) {
                        item {
                            TitanCard(Modifier.pageWidth(800.dp), title = "Personal records") {
                                data.personalRecords.forEach { record ->
                                    Row(Modifier.fillMaxWidth()) {
                                        Text(
                                            record.name,
                                            Modifier.weight(1f),
                                            style = Titan.body(TextSize.sm),
                                            color = Titan.colors.foreground,
                                        )
                                        Text(
                                            record.text,
                                            style = Titan.body(TextSize.sm, FontWeight.SemiBold),
                                            color = Titan.colors.success,
                                        )
                                    }
                                }
                            }
                        }
                    }
                    item {
                        TitanCard(Modifier.pageWidth(800.dp), title = "Next session") {
                            if (data.adaptations.isEmpty()) {
                                MutedText("Steady week — prescriptions hold from your program.")
                            }
                            data.adaptations.forEachIndexed { i, adaptation ->
                                if (i > 0) HorizontalDivider(color = Titan.colors.border)
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text(
                                            adaptation.exerciseName,
                                            style = Titan.body(TextSize.md, FontWeight.SemiBold),
                                            color = Titan.colors.foreground,
                                        )
                                        MutedText(adaptation.explanation)
                                    }
                                    Badge(
                                        if (adaptation.progressed) "Progressed" else "Held",
                                        if (adaptation.progressed) Tone.SUCCESS else Tone.NEUTRAL,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    if (deleting) {
        ConfirmDialog(
            title = "Delete this workout?",
            text = "This permanently removes this workout and everything logged in it. It can’t be undone.",
            cancelLabel = "Keep workout",
            confirmLabel = "Delete workout",
            onDismiss = { deleting = false },
            onConfirm = {
                scope.launch {
                    error = online { graph.api.deleteWorkout(route.sessionId) }
                    if (error == null) {
                        graph.repository.invalidate()
                        navigator.reset(Route.History)
                    }
                }
            },
        )
    }
}

@Composable
fun StatTile(
    label: String,
    value: String,
    tone: Tone?,
    modifier: Modifier = Modifier,
) {
    val c = Titan.colors
    TitanCard(
        modifier,
        padding =
            androidx.compose.foundation.layout
                .PaddingValues(14.dp),
    ) {
        Eyebrow(label)
        Text(value, style = Titan.condensed(TextSize.x3l), color = tone?.let(c::of) ?: c.foreground)
    }
}
