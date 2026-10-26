package net.prussin.titan.ui

import androidx.activity.compose.BackHandler
import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.VerticalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import net.prussin.titan.MainActivity
import net.prussin.titan.R
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.TitanIcon
import net.prussin.titan.ui.components.TitanLockup
import net.prussin.titan.ui.screens.BlockScreen
import net.prussin.titan.ui.screens.CompleteScreen
import net.prussin.titan.ui.screens.DashboardScreen
import net.prussin.titan.ui.screens.HistoryScreen
import net.prussin.titan.ui.screens.ProgramsScreen
import net.prussin.titan.ui.screens.SettingsScreen
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan
import net.prussin.titan.ui.workout.WorkoutScreen

private data class NavItem(
    val section: Section,
    val label: String,
    @DrawableRes val icon: Int,
    @DrawableRes val active: Int,
)

private val NAV =
    listOf(
        NavItem(Section.DASHBOARD, "Dashboard", R.drawable.ph_gauge, R.drawable.ph_gauge_fill),
        NavItem(Section.PROGRAMS, "Programs", R.drawable.ph_barbell, R.drawable.ph_barbell_fill),
        NavItem(
            Section.HISTORY,
            "History",
            R.drawable.ph_clock_counter_clockwise,
            R.drawable.ph_clock_counter_clockwise_fill,
        ),
        NavItem(Section.SETTINGS, "Settings", R.drawable.ph_gear, R.drawable.ph_gear_fill),
    )

/**
 * The signed-in app: a bottom tab bar on a folded phone, a side rail with
 * list/detail panes when unfolded, and the workout full-screen.
 */
@Composable
fun TitanAppUi(open: MutableState<String?>) {
    val graph = LocalGraph.current
    val navigator = rememberNavigator()
    var weighIn by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(open.value) {
        when (open.value) {
            MainActivity.OPEN_WEIGH_IN -> {
                navigator.reset(Route.Dashboard())
                weighIn = true
            }

            MainActivity.OPEN_WORKOUT -> {
                graph.workout.run.value
                    ?.let { navigator.push(Route.Workout(it.sessionId)) }
            }
        }
        open.value = null
    }
    LaunchedEffect(Unit) {
        graph.workout.finished.collect { sessionId ->
            if (navigator.current is Route.Workout) {
                navigator.replace(
                    Route.Complete(sessionId),
                )
            } else {
                navigator.push(Route.Complete(sessionId))
            }
        }
    }
    BackHandler(navigator.canPop) { navigator.pop() }
    val c = Titan.colors
    BoxWithConstraints(Modifier.fillMaxSize().background(c.background).windowInsetsPadding(WindowInsets.safeDrawing)) {
        val wide = maxWidth >= 600.dp
        val panes = maxWidth >= 840.dp
        CompositionLocalProvider(LocalNavigator provides navigator, LocalWide provides wide) {
            val current = navigator.current
            if (current is Route.Workout) {
                WorkoutScreen(current)
            } else if (wide) {
                Row(Modifier.fillMaxSize()) {
                    Rail(current.section) { navigator.reset(it.root) }
                    VerticalDivider(color = c.border)
                    Box(Modifier.weight(1f)) { Pages(navigator, panes, weighIn) { weighIn = false } }
                }
            } else {
                Column(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) { Pages(navigator, false, weighIn) { weighIn = false } }
                    HorizontalDivider(color = c.border)
                    TabBar(current.section) { navigator.reset(it.root) }
                }
            }
        }
    }
}

@Composable
private fun Pages(
    navigator: Navigator,
    panes: Boolean,
    weighIn: Boolean,
    onWeighInOpened: () -> Unit,
) {
    val current = navigator.current
    val below = navigator.stack.getOrNull(navigator.stack.lastIndex - 1)
    when {
        panes && current == Route.History -> {
            ListDetail({ HistoryScreen(null) }) { Placeholder("Pick a session to see its summary.") }
        }

        panes && current is Route.Complete && below == Route.History -> {
            ListDetail({ HistoryScreen(current.sessionId) }) { CompleteScreen(current) }
        }

        panes && current == Route.Programs -> {
            ListDetail({ ProgramsScreen(null) }) { Placeholder("Pick a block to see its weeks.") }
        }

        panes && current is Route.Block && below == Route.Programs -> {
            ListDetail({ ProgramsScreen(current.blockId) }) { BlockScreen(current) }
        }

        else -> {
            Single(current, weighIn, onWeighInOpened)
        }
    }
}

@Composable
private fun Single(
    route: Route,
    weighIn: Boolean,
    onWeighInOpened: () -> Unit,
) {
    when (route) {
        is Route.Dashboard -> DashboardScreen(route, weighIn, onWeighInOpened)
        is Route.Complete -> CompleteScreen(route)
        Route.History -> HistoryScreen(null)
        Route.Programs -> ProgramsScreen(null)
        is Route.Block -> BlockScreen(route)
        Route.Settings -> SettingsScreen()
        is Route.Workout -> WorkoutScreen(route)
    }
}

@Composable
private fun ListDetail(
    list: @Composable () -> Unit,
    detail: @Composable () -> Unit,
) {
    Row(Modifier.fillMaxSize()) {
        Box(Modifier.weight(0.42f).fillMaxHeight()) { list() }
        VerticalDivider(color = Titan.colors.border)
        Box(Modifier.weight(0.58f).fillMaxHeight()) { detail() }
    }
}

@Composable
private fun Placeholder(text: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { MutedText(text, size = TextSize.md) }
}

/** Open a detail page: beside its list it replaces the previous detail. */
fun Navigator.openDetail(route: Route) {
    if (current::class == route::class) replace(route) else push(route)
}

@Composable
private fun TabBar(
    active: Section,
    onSelect: (Section) -> Unit,
) {
    Row(Modifier.fillMaxWidth().height(64.dp).background(Titan.colors.background)) {
        NAV.forEach { item -> NavButton(item, item.section == active, vertical = true, onSelect = onSelect) }
    }
}

@Composable
private fun Rail(
    active: Section,
    onSelect: (Section) -> Unit,
) {
    Column(
        Modifier
            .width(208.dp)
            .fillMaxHeight()
            .background(Titan.colors.surfaceDesk)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        TitanLockup(
            Modifier.padding(start = 8.dp, top = 8.dp, bottom = 20.dp),
            markSize = 26.dp,
            textSize = TextSize.x2l,
        )
        NAV.forEach { item ->
            Row(
                Modifier.fillMaxWidth(),
            ) { NavButton(item, item.section == active, vertical = false, onSelect = onSelect) }
        }
    }
}

@Composable
private fun RowScope.NavButton(
    item: NavItem,
    selected: Boolean,
    vertical: Boolean,
    onSelect: (Section) -> Unit,
) {
    val c = Titan.colors
    val color = if (selected) c.foreground else c.muted
    val modifier =
        Modifier
            .weight(1f)
            .clickable(role = Role.Tab) { onSelect(item.section) }
    if (vertical) {
        Column(
            modifier.fillMaxHeight(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            TitanIcon(if (selected) item.active else item.icon, if (selected) c.accent else color, 24.dp)
            Text(item.label, style = Titan.body(TextSize.xs, FontWeight.Medium), color = color)
        }
    } else {
        Row(
            modifier
                .background(
                    if (selected) c.alpha(c.foreground, 0.06) else androidx.compose.ui.graphics.Color.Transparent,
                    net.prussin.titan.ui.theme.Radii.md,
                ).padding(horizontal = 10.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TitanIcon(if (selected) item.active else item.icon, if (selected) c.accent else color, 22.dp)
            Text(item.label, style = Titan.body(TextSize.md, FontWeight.Medium), color = color)
        }
    }
}
