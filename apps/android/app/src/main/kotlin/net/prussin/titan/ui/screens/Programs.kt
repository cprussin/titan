package net.prussin.titan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
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
import net.prussin.titan.core.format.prescriptionParts
import net.prussin.titan.core.format.roleTone
import net.prussin.titan.core.wire.BlockDayContent
import net.prussin.titan.core.wire.BlockDayView
import net.prussin.titan.core.wire.BlockLayout
import net.prussin.titan.core.wire.BlockOutcome
import net.prussin.titan.core.wire.BlockSlotView
import net.prussin.titan.core.wire.BlockView
import net.prussin.titan.core.wire.ProgramBlockCard
import net.prussin.titan.core.wire.ProgramCard
import net.prussin.titan.core.wire.ProgramsData
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.LocalNavigator
import net.prussin.titan.ui.Route
import net.prussin.titan.ui.components.Badge
import net.prussin.titan.ui.components.ConfirmDialog
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.Crumb
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.PageBody
import net.prussin.titan.ui.components.SectionTitle
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanCard
import net.prussin.titan.ui.components.TitanIcon
import net.prussin.titan.ui.components.TitanIconButton
import net.prussin.titan.ui.components.TopBar
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.components.pageWidth
import net.prussin.titan.ui.components.rememberResource
import net.prussin.titan.ui.openDetail
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

private val GOAL_TONES = listOf(Tone.ACCENT, Tone.SUCCESS, Tone.WARNING)

@Composable
fun ProgramsScreen(selected: String?) {
    val resource = rememberResource("programs", ProgramsData.serializer()) { programs() }
    Column {
        TopBar("Programs", icon = R.drawable.ph_barbell)
        PageBody(resource.status, resource.value != null, maxWidth = 900.dp) {
            val data = resource.value ?: return@PageBody
            data.active?.let { active ->
                item { SectionTitle("Active program", Modifier.pageWidth(900.dp)) }
                item { ProgramCardView(active, selected) }
            }
            if (data.others.isNotEmpty() &&
                data.active != null
            ) {
                item { SectionTitle("All programs", Modifier.pageWidth(900.dp)) }
            }
            items(data.others, key = { it.versionId }) { ProgramCardView(it, selected) }
        }
    }
}

@Composable
private fun ProgramCardView(
    card: ProgramCard,
    selected: String?,
) {
    TitanCard(Modifier.pageWidth(900.dp)) {
        Text(card.name, style = Titan.condensed(TextSize.x2l), color = Titan.colors.foreground)
        if (card.goals.isNotEmpty()) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                card.goals.forEachIndexed { i, goal -> Badge(goal, GOAL_TONES[i % GOAL_TONES.size]) }
            }
        }
        MutedText(card.description)
        Column {
            card.blocks.forEachIndexed { i, block ->
                if (i > 0) HorizontalDivider(color = Titan.colors.border)
                BlockRow(block, block.id == selected)
            }
        }
    }
}

@Composable
private fun BlockRow(
    block: ProgramBlockCard,
    selected: Boolean,
) {
    val navigator = LocalNavigator.current
    val c = Titan.colors
    Row(
        Modifier
            .fillMaxWidth()
            .clip(Radii.md)
            .background(if (selected) c.alpha(c.accent, 0.12) else Color.Transparent)
            .clickable { navigator.openDetail(Route.Block(block.versionId, block.id)) }
            .padding(vertical = 10.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(Modifier.weight(1f)) {
            Text(block.name, style = Titan.body(TextSize.md, FontWeight.SemiBold), color = c.foreground)
            Text(block.meta, style = Titan.body(TextSize.sm), color = c.muted)
        }
        SetActive(block.versionId, block.id, block.name, block.active, compact = true)
    }
}

/** "Active" badge, or the button that makes this block the active one. */
@Composable
private fun SetActive(
    versionId: String,
    blockId: String,
    name: String,
    active: Boolean,
    compact: Boolean,
) {
    val graph = LocalGraph.current
    val scope = rememberCoroutineScope()
    var confirming by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    if (active) {
        Badge("Active", Tone.SUCCESS)
    } else if (compact) {
        TitanIconButton(R.drawable.ph_target, "Set $name as active block", { confirming = true }, size = ControlSize.SM)
    } else {
        TitanButton("Set as active", {
            confirming = true
        }, variant = Variant.ACCENT, size = ControlSize.SM, icon = R.drawable.ph_target)
    }
    error?.let { Text(it, style = Titan.body(TextSize.xs), color = Titan.colors.danger) }
    if (confirming) {
        ConfirmDialog(
            title = "Make $name active?",
            text = "This makes $name your active block and resets today’s plan to its first week.",
            cancelLabel = "Cancel",
            confirmLabel = "Set as active",
            confirmVariant = Variant.ACCENT,
            onDismiss = { confirming = false },
            onConfirm = {
                scope.launch {
                    error = online { graph.api.setActiveBlock(versionId, blockId) }
                    graph.repository.invalidate()
                    graph.repository.refreshPlan()
                }
            },
        )
    }
}

private val DAYS = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

@Composable
fun BlockScreen(route: Route.Block) {
    val navigator = LocalNavigator.current
    val resource =
        rememberResource("block:${route.versionId}:${route.blockId}", BlockView.serializer()) {
            block(route.versionId, route.blockId)
        }
    val view = resource.value
    Column {
        TopBar(
            view?.name ?: "Block",
            icon = R.drawable.ph_barbell,
            crumbs = listOf(Crumb("Programs") { navigator.reset(Route.Programs) }),
        )
        PageBody(resource.status, view != null, maxWidth = 900.dp) {
            if (view == null) return@PageBody
            item {
                Column(Modifier.pageWidth(900.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Eyebrow(view.programName)
                    Text(view.name, style = Titan.condensed(TextSize.x4l), color = Titan.colors.foreground)
                    SetActive(view.versionId, view.blockId, view.name, view.active, compact = false)
                }
            }
            when (val layout = view.layout) {
                is BlockLayout.Weeks -> {
                    items(layout.weeks, key = { it.week }) { week ->
                        var open by rememberSaveable { mutableStateOf(false) }
                        TitanCard(Modifier.pageWidth(900.dp)) {
                            Row(
                                Modifier.fillMaxWidth().clickable { open = !open },
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        "Week ${week.week}",
                                        style = Titan.body(TextSize.md, FontWeight.SemiBold),
                                        color = Titan.colors.foreground,
                                    )
                                    MutedText(week.summary)
                                }
                                if (week.isDeload) Badge("Deload", Tone.WARNING)
                                TitanIcon(
                                    if (open) R.drawable.ph_caret_down else R.drawable.ph_caret_right,
                                    Titan.colors.muted,
                                )
                            }
                            if (open) {
                                if (week.isDeload) {
                                    MutedText(
                                        "Deload week — the engine holds loads and trims volume ~40–50%.",
                                    )
                                }
                                week.days.forEach { Day(it) }
                            }
                        }
                    }
                }

                is BlockLayout.Fixed -> {
                    items(layout.days, key = { it.key }) { day -> TitanCard(Modifier.pageWidth(900.dp)) { Day(day) } }
                }
            }
            when (val outcome = view.outcome) {
                is BlockOutcome.Next -> {
                    item {
                        TitanCard(Modifier.pageWidth(900.dp), title = "When this block ends") {
                            Row(
                                Modifier.fillMaxWidth().clickable {
                                    navigator.replace(
                                        Route.Block(view.versionId, outcome.blockId),
                                    )
                                },
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Eyebrow("Rolls into")
                                    Text(
                                        outcome.name,
                                        style = Titan.body(TextSize.md, FontWeight.SemiBold),
                                        color = Titan.colors.foreground,
                                    )
                                    MutedText("Week 1 — working loads carry forward from this block.")
                                }
                                TitanIcon(R.drawable.ph_arrow_right_bold, Titan.colors.muted)
                            }
                        }
                    }
                }

                BlockOutcome.Complete -> {
                    item {
                        TitanCard(Modifier.pageWidth(900.dp), title = "When this block ends") {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                TitanIcon(R.drawable.ph_flag_checkered, Titan.colors.success)
                                Text(
                                    "You'll have completed ${view.programName}.",
                                    style = Titan.body(),
                                    color = Titan.colors.foreground,
                                )
                            }
                        }
                    }
                }

                BlockOutcome.Repeats -> {}
            }
        }
    }
}

@Composable
private fun Day(day: BlockDayView) {
    val c = Titan.colors
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        HorizontalDivider(color = c.border)
        Row(verticalAlignment = Alignment.Bottom) {
            Column(Modifier.weight(1f)) {
                Eyebrow(day.dayName)
                Text(
                    day.name + (day.variantTag?.let { "  ·  $it" } ?: ""),
                    style = Titan.condensed(TextSize.xl),
                    color = c.foreground,
                )
            }
            Text("${day.durationMin} min", style = Titan.mono(TextSize.sm), color = c.muted)
        }
        when (val content = day.content) {
            is BlockDayContent.Slots -> {
                content.slots.forEach { Slot(it) }
            }

            is BlockDayContent.Options -> {
                MutedText(content.hint)
                content.options.forEachIndexed { i, option ->
                    Text(
                        option.label ?: "Option ${i + 1}",
                        style = Titan.body(TextSize.sm, FontWeight.SemiBold),
                        color = c.accent,
                    )
                    option.slots.forEach { Slot(it) }
                }
            }
        }
    }
}

@Composable
private fun Slot(
    slot: BlockSlotView,
) {
    val c = Titan.colors
    val parts = prescriptionParts(slot.prescription)
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        slot.position?.let {
            Text(
                "$it",
                Modifier.width(20.dp),
                style = Titan.mono(TextSize.sm),
                color = c.textTertiary,
            )
        }
        Column(Modifier.weight(1f)) {
            Text(slot.name, style = Titan.body(TextSize.md, FontWeight.Medium), color = c.foreground)
            Text(parts.primary, style = Titan.mono(TextSize.sm), color = c.muted)
            parts.recovery?.let { Text(it, style = Titan.mono(TextSize.xs), color = c.textTertiary) }
        }
        Badge(slot.role.replaceFirstChar(Char::uppercase), roleTone(slot.role))
    }
}
