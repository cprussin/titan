package net.prussin.titan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import net.prussin.titan.R
import net.prussin.titan.core.format.formatBodyWeight
import net.prussin.titan.core.format.formatSplitClock
import net.prussin.titan.core.format.formatWeight
import net.prussin.titan.core.wire.AlternativeChoice
import net.prussin.titan.core.wire.DashboardBody
import net.prussin.titan.core.wire.DashboardData
import net.prussin.titan.core.wire.DashboardHeader
import net.prussin.titan.core.wire.DashboardPrimary
import net.prussin.titan.core.wire.DashboardSession
import net.prussin.titan.core.wire.Trends
import net.prussin.titan.core.wire.WeekDay
import net.prussin.titan.core.wire.WeekResponse
import net.prussin.titan.core.wire.WorkoutAction
import net.prussin.titan.data.LoadStatus
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.LocalNavigator
import net.prussin.titan.ui.Route
import net.prussin.titan.ui.components.Badge
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.LogGrid
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.NoteAside
import net.prussin.titan.ui.components.PageBody
import net.prussin.titan.ui.components.PrescriptionGrid
import net.prussin.titan.ui.components.Sparkline
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanIconButton
import net.prussin.titan.ui.components.TopBar
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.components.pageWidth
import net.prussin.titan.ui.components.rememberResource
import net.prussin.titan.ui.components.toneOf
import net.prussin.titan.ui.formatCalendarDate
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan
import net.prussin.titan.ui.today

@Composable
fun DashboardScreen(
    route: Route.Dashboard,
    openWeighIn: Boolean,
    onWeighInOpened: () -> Unit,
) {
    val graph = LocalGraph.current
    val date = route.date ?: today()
    val resource =
        rememberResource("dashboard:$date:${route.week ?: 0}", DashboardData.serializer()) {
            dashboard(route.date, route.week)
        }
    val plan by produceCachedPlan()
    var weighIn by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(openWeighIn) {
        if (openWeighIn) {
            weighIn = true
            onWeighInOpened()
        }
    }
    val data = resource.value
    val offlineToday =
        data == null && resource.status != LoadStatus.LOADING && plan?.days?.any { it.date == date } == true
    Column {
        TopBar("Dashboard", icon = R.drawable.ph_gauge)
        PageBody(resource.status, data != null || offlineToday, loadingText = "Loading today…") {
            if (data != null) {
                item { TrendsBand(data.trends, Modifier.pageWidth(1024.dp)) }
                item { Section { WeekRibbon(data.week.days, data.week.weekOffset, data.week.selectedDate) } }
                item { Section { Header(data.header, date) { weighIn = true } } }
                item { Section { SessionBlock(data.body, data.names, data.session) } }
            } else {
                val day = plan?.days?.first { it.date == date }
                if (day != null) {
                    item {
                        Section {
                            OfflineHeader(
                                day.templateName,
                                date,
                                day.options.mapIndexedNotNull { i, option ->
                                    option.alternativeId?.let {
                                        AlternativeChoice(
                                            it,
                                            option.label ?: "Option ${i + 1}",
                                        )
                                    }
                                },
                            ) { weighIn = true }
                        }
                    }
                    item {
                        Section {
                            PrescriptionGrid(day.options.first().prescribedExercises, plan!!.exerciseNames, "Load")
                        }
                    }
                }
            }
        }
    }
    if (weighIn) WeighInDialog(onDismiss = { weighIn = false })
    val conflict by graph.workout.conflict.collectAsState()
    conflict?.let { ConflictDialog() }
}

@Composable
private fun produceCachedPlan(): androidx.compose.runtime.State<net.prussin.titan.core.wire.OfflinePlan?> {
    val graph = LocalGraph.current
    val changes by graph.repository.changes.collectAsState()
    return androidx.compose.runtime.produceState<net.prussin.titan.core.wire.OfflinePlan?>(null, changes) {
        value = graph.repository.plan()
    }
}

/** A dashboard section, set off by a hairline rule. */
@Composable
private fun Section(content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.pageWidth(1024.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        HorizontalDivider(color = Titan.colors.border)
        content()
    }
}

@Composable
private fun Header(
    header: DashboardHeader,
    date: String,
    onWeighIn: () -> Unit,
) {
    val navigator = LocalNavigator.current
    val c = Titan.colors
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            header.eyebrow.program?.let { program ->
                Text(
                    program.name.uppercase(),
                    Modifier.clickable { navigator.push(Route.Block(program.versionId, program.blockId)) },
                    style = Titan.body(TextSize.xs, FontWeight.Bold).copy(letterSpacing = TextSize.xs * 0.05),
                    color = c.accent,
                )
            }
            header.eyebrow.weekCount?.let { Eyebrow(it) }
            header.eyebrow.status?.let { Badge(it.text, toneOf(it.tone)) }
        }
        Text(header.title, style = Titan.condensed(TextSize.x4l), color = c.foreground)
        Actions(header.primary, date, onWeighIn)
    }
}

@Composable
private fun OfflineHeader(
    title: String,
    date: String,
    alternatives: List<AlternativeChoice>,
    onWeighIn: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Eyebrow("Saved plan")
        Text(title, style = Titan.condensed(TextSize.x4l), color = Titan.colors.foreground)
        Actions(DashboardPrimary.StartWorkout(WorkoutAction.Start(alternatives)), date, onWeighIn)
    }
}

/** The weigh-in button and the day's primary action (`DashboardHeader`). */
@Composable
private fun Actions(
    primary: DashboardPrimary,
    date: String,
    onWeighIn: () -> Unit,
) {
    val graph = LocalGraph.current
    val navigator = LocalNavigator.current
    val running by graph.workout.run.collectAsState()
    var starting by remember { mutableStateOf<StartRequest?>(null) }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        TitanButton("Weigh in", onWeighIn, variant = Variant.GHOST, size = ControlSize.LG, icon = R.drawable.ph_scales)
        val active = running
        if (active != null) {
            TitanButton(
                "Continue workout",
                { navigator.push(Route.Workout(active.sessionId)) },
                variant = Variant.ACCENT,
                size = ControlSize.LG,
                trailingIcon = R.drawable.ph_arrow_right_bold,
            )
        } else {
            when (primary) {
                is DashboardPrimary.StartWorkout -> {
                    when (val action = primary.action) {
                        is WorkoutAction.Start -> {
                            TitanButton(
                                "Start workout",
                                { starting = StartRequest(date, action.alternatives, fill = false) },
                                variant = Variant.ACCENT,
                                size = ControlSize.LG,
                                icon = R.drawable.ph_play,
                            )
                        }

                        is WorkoutAction.Continue -> {
                            TitanButton(
                                "Continue workout",
                                { navigator.push(Route.Workout(action.sessionId)) },
                                variant = Variant.ACCENT,
                                size = ControlSize.LG,
                                trailingIcon = R.drawable.ph_arrow_right_bold,
                            )
                        }

                        WorkoutAction.Done -> {}
                    }
                }

                is DashboardPrimary.FillWorkout -> {
                    TitanButton(
                        "Log workout",
                        { starting = StartRequest(primary.date, primary.alternatives, fill = true) },
                        variant = Variant.ACCENT,
                        size = ControlSize.LG,
                        icon = R.drawable.ph_list_checks,
                    )
                }

                DashboardPrimary.BackToToday -> {
                    TitanButton(
                        "Back to today",
                        { navigator.replace(Route.Dashboard()) },
                        variant = Variant.OUTLINE,
                        size = ControlSize.LG,
                    )
                }

                DashboardPrimary.None -> {}
            }
        }
    }
    starting?.let { request ->
        StartWorkoutDialog(request, onDismiss = { starting = null }) { sessionId ->
            starting = null
            navigator.push(Route.Workout(sessionId))
        }
    }
}

data class StartRequest(
    val date: String,
    val alternatives: List<AlternativeChoice>,
    val fill: Boolean,
)

@Composable
private fun SessionBlock(
    body: DashboardBody,
    names: Map<String, String>,
    session: DashboardSession?,
) {
    when (body) {
        is DashboardBody.Rest -> {
            Text(body.copy, style = Titan.body(TextSize.lg), color = Titan.colors.muted)
        }

        is DashboardBody.Plan -> {
            session?.let { SessionHeader(it) }
            PrescriptionGrid(body.exercises, names, body.loadHeader)
        }

        is DashboardBody.Log -> {
            session?.let { SessionHeader(it) }
            LogGrid(body.view.exercises)
            NoteAside(body.view.notes)
        }
    }
}

@Composable
private fun SessionHeader(session: DashboardSession) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Eyebrow(session.label, Modifier.align(Alignment.CenterVertically))
        Text(session.summary, style = Titan.mono(TextSize.sm), color = Titan.colors.muted)
    }
}

/** One trend column: label, latest figure, its date, and a tappable sparkline. */
private data class TrendColumn(
    val label: String,
    val values: List<Double>,
    val dates: List<String>,
    val format: (Double) -> String,
)

@Composable
private fun TrendsBand(
    trends: Trends,
    modifier: Modifier = Modifier,
) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    val strength =
        trends.strengthSeries.map { series ->
            TrendColumn(
                "Est. 1RM · ${trends.names[series.exerciseId] ?: series.exerciseId}",
                series.values,
                series.dates,
            ) { formatWeight(it, series.unit) }
        }
    val bodyWeight = TrendColumn("Body weight", trends.bodyWeight.series, trends.bodyWeight.dates, ::formatBodyWeight)
    val lead = listOfNotNull(strength.firstOrNull(), bodyWeight)
    val extras =
        listOfNotNull(
            strength.getOrNull(1),
            trends.rowPace?.let { TrendColumn("Row pace · 500m split", it.values, it.dates, ::formatSplitClock) },
        )
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        val shown = if (expanded) lead + extras else lead
        shown.chunked(2).forEach { pair ->
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                pair.forEach { TrendCell(it, Modifier.weight(1f)) }
                if (pair.size == 1) {
                    androidx.compose.foundation.layout
                        .Spacer(Modifier.weight(1f))
                }
            }
        }
        if (extras.isNotEmpty()) {
            TitanButton(
                if (expanded) "Show less" else "Show more",
                { expanded = !expanded },
                variant = Variant.GHOST,
                size = ControlSize.SM,
            )
        }
    }
}

@Composable
private fun TrendCell(
    column: TrendColumn,
    modifier: Modifier,
) {
    var selected by remember(column.values) { mutableStateOf<Int?>(null) }
    val index = selected ?: column.values.lastIndex
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Eyebrow(column.label)
        Text(
            column.values.getOrNull(index)?.let(column.format) ?: "—",
            style = Titan.condensed(TextSize.x3l),
            color = Titan.colors.foreground,
        )
        column.dates.getOrNull(index)?.let { MutedText(formatCalendarDate(it), size = TextSize.xs) }
        Sparkline(
            column.values,
            Modifier
                .fillMaxWidth()
                .height(36.dp)
                .clickable(enabled = column.values.size > 1) {
                    selected = ((selected ?: column.values.lastIndex) + 1) % column.values.size
                },
            selected = selected,
        )
    }
}

/** The week strip (`WeekRibbon`): swipe through days, loading neighbouring weeks on demand. */
@Composable
private fun WeekRibbon(
    days: List<WeekDay>,
    offset: Int,
    selectedDate: String,
) {
    val graph = LocalGraph.current
    val navigator = LocalNavigator.current
    val scope = rememberCoroutineScope()
    val weeks = remember(days) { mutableStateMapOf(offset to days) }
    val cells = weeks.entries.sortedBy { it.key }.flatMap { (week, list) -> list.map { week to it } }
    val state =
        rememberLazyListState(
            initialFirstVisibleItemIndex = days.indexOfFirst { it.date == selectedDate }.coerceAtLeast(0),
        )

    suspend fun load(week: Int) {
        if (week in weeks) return
        graph.repository.fetch("week:$week", WeekResponse.serializer()) { week(week) }?.let { weeks[week] = it.days }
    }
    LaunchedEffect(state, days) {
        snapshotFlow {
            state.firstVisibleItemIndex to (
                state.layoutInfo.visibleItemsInfo
                    .lastOrNull()
                    ?.index ?: 0
            )
        }.collect { (first, last) ->
            val loaded = weeks.keys
            if (first < 3) {
                val before = loaded.min() - 1
                load(before)
                // Keep the same days in view once the earlier week is prepended.
                weeks[before]?.let { state.scrollToItem(first + it.size) }
            }
            if (last > cells.size - 4) load(loaded.max() + 1)
        }
    }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        TitanIconButton(R.drawable.ph_caret_left, "Show earlier days", {
            scope.launch { state.animateScrollToItem((state.firstVisibleItemIndex - 3).coerceAtLeast(0)) }
        }, variant = Variant.OUTLINE, size = ControlSize.SM)
        LazyRow(
            Modifier.weight(1f),
            state = state,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            itemsIndexed(cells, key = { _, cell -> cell.second.date }) { _, (week, day) ->
                DayCell(day, day.date == selectedDate) {
                    navigator.replace(
                        if (day.isToday) {
                            Route.Dashboard()
                        } else {
                            Route.Dashboard(
                                day.date,
                                week.takeIf {
                                    it !=
                                        0
                                },
                            )
                        },
                    )
                }
            }
        }
        TitanIconButton(R.drawable.ph_caret_right, "Show later days", {
            scope.launch { state.animateScrollToItem(state.firstVisibleItemIndex + 3) }
        }, variant = Variant.OUTLINE, size = ControlSize.SM)
    }
}

@Composable
private fun DayCell(
    day: WeekDay,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val c = Titan.colors
    val (name, color) =
        when (day) {
            is WeekDay.Rest -> "Rest" to c.muted
            is WeekDay.Planned -> day.name to c.foreground
            is WeekDay.Logged -> "${day.name} ✓" to c.success
        }
    Column(
        Modifier
            .widthIn(min = 136.dp)
            .width(136.dp)
            .alpha(if (day.isPast && !selected) 0.65f else 1f)
            .clip(Radii.md)
            .background(if (selected) c.alpha(c.accent, 0.15) else Color.Transparent)
            .border(1.dp, if (selected) c.accent else c.border, Radii.md)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp)
            .fillMaxHeight(),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Eyebrow(
            day.label + if (day.isToday) " · TODAY" else "",
            color =
                if (day.isToday ||
                    selected
                ) {
                    c.accent
                } else {
                    c.textTertiary
                },
        )
        Text(name, style = Titan.body(TextSize.sm, FontWeight.SemiBold), color = color, maxLines = 1)
    }
}
