package net.prussin.titan.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.runtime.staticCompositionLocalOf
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import net.prussin.titan.AppGraph
import net.prussin.titan.core.wire.WireJson

/** Every page the app shows, mirroring the web's routes. */
@Serializable
sealed interface Route {
    /** The top-level section this page belongs to, for the nav bar. */
    val section: Section

    @Serializable
    @SerialName("dashboard")
    data class Dashboard(
        val date: String? = null,
        val week: Int? = null,
    ) : Route {
        override val section get() = Section.DASHBOARD
    }

    @Serializable
    @SerialName("workout")
    data class Workout(
        val sessionId: String,
    ) : Route {
        override val section get() = Section.DASHBOARD
    }

    @Serializable
    @SerialName("complete")
    data class Complete(
        val sessionId: String,
    ) : Route {
        override val section get() = Section.HISTORY
    }

    @Serializable
    @SerialName("history")
    data object History : Route {
        override val section get() = Section.HISTORY
    }

    @Serializable
    @SerialName("programs")
    data object Programs : Route {
        override val section get() = Section.PROGRAMS
    }

    @Serializable
    @SerialName("block")
    data class Block(
        val versionId: String,
        val blockId: String,
    ) : Route {
        override val section get() = Section.PROGRAMS
    }

    @Serializable
    @SerialName("settings")
    data object Settings : Route {
        override val section get() = Section.SETTINGS
    }
}

enum class Section(
    val root: Route,
) {
    DASHBOARD(Route.Dashboard()),
    PROGRAMS(Route.Programs),
    HISTORY(Route.History),
    SETTINGS(Route.Settings),
}

/** A plain back stack; the bottom entry is always a section root. */
class Navigator(
    val stack: SnapshotStateList<Route>,
) {
    val current: Route get() = stack.last()
    val canPop: Boolean get() = stack.size > 1

    fun push(route: Route) {
        if (current != route) stack.add(route)
    }

    /** Swap the top page (a dashboard day change, a finished workout's summary). */
    fun replace(route: Route) {
        stack[stack.lastIndex] = route
    }

    fun pop() {
        if (canPop) stack.removeAt(stack.lastIndex)
    }

    /** Jump to a section's root, as the nav bar does. */
    fun reset(route: Route) {
        stack.clear()
        stack.add(route)
    }
}

@Composable
fun rememberNavigator(): Navigator {
    val stack =
        rememberSaveable(
            saver =
                listSaver(
                    save = { routes -> routes.map { WireJson.encodeToString(Route.serializer(), it) } },
                    restore = { saved ->
                        mutableStateListOf<Route>().apply {
                            addAll(saved.map { WireJson.decodeFromString(Route.serializer(), it) })
                        }
                    },
                ),
        ) { mutableStateListOf<Route>(Route.Dashboard()) }
    return Navigator(stack)
}

val LocalGraph = staticCompositionLocalOf<AppGraph> { error("no graph") }
val LocalNavigator = staticCompositionLocalOf<Navigator> { error("no navigator") }

/** Whether the window is wide enough for side-by-side panes (an unfolded Fold). */
val LocalWide = staticCompositionLocalOf { false }
