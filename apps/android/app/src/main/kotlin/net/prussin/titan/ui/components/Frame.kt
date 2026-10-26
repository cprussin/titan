package net.prussin.titan.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.serialization.KSerializer
import net.prussin.titan.R
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.data.LoadStatus
import net.prussin.titan.data.Resource
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.LocalWide
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

/** A server view, cached for offline, refetched whenever data changes. */
@Composable
fun <T> rememberResource(
    key: String,
    serializer: KSerializer<T>,
    fetch: suspend TitanApi.() -> T,
): Resource<T> {
    val repository = LocalGraph.current.repository
    val flow = remember(key) { repository.observe(key, serializer, fetch) }
    val state by flow.collectAsState(Resource<T>(null, LoadStatus.LOADING))
    return state
}

data class Crumb(
    val label: String,
    val onClick: () -> Unit,
)

/** The slim header every page opens with (`TopBar`). */
@Composable
fun TopBar(
    title: String,
    modifier: Modifier = Modifier,
    @DrawableRes icon: Int? = null,
    crumbs: List<Crumb> = emptyList(),
    actions: @Composable RowScope.() -> Unit = {},
) {
    val c = Titan.colors
    Column(modifier.fillMaxWidth().background(c.background)) {
        Row(
            Modifier.fillMaxWidth().height(52.dp).padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            if (!LocalWide.current) {
                TitanLockup(Modifier.padding(end = 6.dp))
            }
            icon?.let { TitanIcon(it, c.accent, 18.dp) }
            crumbs.forEach { crumb ->
                Text(
                    crumb.label,
                    modifier = Modifier.clickable(onClick = crumb.onClick),
                    style = Titan.body(TextSize.sm),
                    color = c.muted,
                    maxLines = 1,
                )
                TitanIcon(R.drawable.ph_caret_right, c.textTertiary, 12.dp)
            }
            Text(
                title,
                modifier = Modifier.weight(1f),
                style = Titan.body(TextSize.sm, FontWeight.SemiBold),
                color = c.foreground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                actions()
            }
        }
        HorizontalDivider(color = c.border)
    }
}

/**
 * A page body: a scrolling, centered column that pulls to refresh, with the
 * load state shown the way the web shows it.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PageBody(
    status: LoadStatus?,
    hasValue: Boolean,
    modifier: Modifier = Modifier,
    maxWidth: Dp = 1100.dp,
    loadingText: String = "Loading…",
    content: LazyListScope.() -> Unit,
) {
    val repository = LocalGraph.current.repository
    PullToRefreshBox(
        isRefreshing = status == LoadStatus.LOADING && hasValue,
        onRefresh = { repository.invalidate() },
        modifier = modifier.fillMaxSize(),
    ) {
        if (!hasValue) {
            EmptyState(status, loadingText)
        } else {
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                if (status == LoadStatus.OFFLINE) item { OfflineNote(Modifier.widthIn(max = maxWidth)) }
                content()
                item { Spacer(Modifier.height(24.dp)) }
            }
        }
    }
}

@Composable
private fun EmptyState(
    status: LoadStatus?,
    loadingText: String,
) {
    val repository = LocalGraph.current.repository
    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(32.dp)) {
        item {
            Column(
                Modifier.fillMaxWidth().padding(top = 64.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                when (status) {
                    LoadStatus.LOADING, null -> {
                        CircularProgressIndicator(color = Titan.colors.accent, modifier = Modifier.size(28.dp))
                        MutedText(loadingText)
                    }

                    LoadStatus.OFFLINE -> {
                        TitanIcon(R.drawable.ph_warning, Titan.colors.muted, 28.dp)
                        MutedText("You're offline, and this page hasn't been loaded on this phone yet.")
                        TitanButton("Try again", { repository.invalidate() }, variant = Variant.OUTLINE)
                    }

                    LoadStatus.FAILED, LoadStatus.READY -> {
                        TitanIcon(R.drawable.ph_warning, Titan.colors.danger, 28.dp)
                        MutedText("Something went wrong loading this page.")
                        TitanButton("Try again", { repository.invalidate() }, variant = Variant.OUTLINE)
                    }
                }
            }
        }
    }
}

@Composable
fun OfflineNote(modifier: Modifier = Modifier) {
    val c = Titan.colors
    Row(
        modifier
            .fillMaxWidth()
            .background(c.alpha(c.warning, 0.12), net.prussin.titan.ui.theme.Radii.lg)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TitanIcon(R.drawable.ph_warning, c.warning, 16.dp)
        Text(
            "Offline — showing what this phone last loaded. Changes sync when you reconnect.",
            style = Titan.body(TextSize.sm),
            color = c.foreground,
        )
    }
}

/** The Monolith mark (`TitanMark`): an accent slab over three columns. */
@Composable
fun TitanMark(
    size: Dp,
    modifier: Modifier = Modifier,
) {
    val c = Titan.colors
    Canvas(modifier.size(size)) {
        val unit = this.size.width / 96f
        val radius = CornerRadius(2 * unit)
        drawRoundRect(c.accent, Offset(12 * unit, 12 * unit), Size(72 * unit, 14 * unit), radius)
        listOf(20f, 41f, 62f).forEach { x ->
            drawRoundRect(c.foreground, Offset(x * unit, 32 * unit), Size(14 * unit, 54 * unit), radius)
        }
    }
}

/** Mark and wordmark side by side (`TitanLockup`). */
@Composable
fun TitanLockup(
    modifier: Modifier = Modifier,
    markSize: Dp = 22.dp,
    textSize: androidx.compose.ui.unit.TextUnit = TextSize.lg,
) {
    Row(modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        TitanMark(markSize)
        Text(
            "TITAN",
            style = Titan.condensed(textSize).copy(letterSpacing = textSize * 0.06),
            color = Titan.colors.foreground,
        )
    }
}

/** A min–max normalized polyline (`Sparkline`). */
@Composable
fun Sparkline(
    values: List<Double>,
    modifier: Modifier = Modifier,
    color: Color = Titan.colors.accent,
    selected: Int? = null,
) {
    if (values.size < 2) {
        MutedText("Not enough data yet", modifier, size = TextSize.xs)
        return
    }
    val low = values.min()
    val high = values.max()
    val span = (high - low).takeIf { it > 0 } ?: 1.0
    Box(modifier) {
        Canvas(Modifier.fillMaxSize()) {
            val step = size.width / (values.size - 1)
            val points =
                values.mapIndexed { i, v ->
                    Offset(i * step, (size.height - 4f) * (1 - ((v - low) / span).toFloat()) + 2f)
                }
            points.zipWithNext { a, b -> drawLine(color, a, b, strokeWidth = 2.dp.toPx()) }
            val dot = points[selected ?: points.lastIndex]
            drawCircle(color, 3.dp.toPx(), dot)
        }
    }
}

@Composable
fun SectionTitle(
    text: String,
    modifier: Modifier = Modifier,
) {
    Text(
        text,
        modifier = modifier,
        style = Titan.body(TextSize.sm, FontWeight.SemiBold),
        color = Titan.colors.foreground,
    )
}

/** Centers page content at a readable width on an unfolded screen. */
fun Modifier.pageWidth(max: Dp = 1100.dp): Modifier = this.widthIn(max = max).fillMaxWidth()
