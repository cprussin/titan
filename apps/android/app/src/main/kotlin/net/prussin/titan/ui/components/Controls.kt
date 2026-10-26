package net.prussin.titan.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import net.prussin.titan.core.format.Tone
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

/** The component library's `Button` variants. */
enum class Variant { PRIMARY, SOLID, GHOST, OUTLINE, SUCCESS, DANGER, WARNING, ACCENT }

/** Control sizes, with heights raised to comfortable touch targets. */
enum class ControlSize(
    val height: Dp,
    val text: TextUnit,
    val padding: Dp,
    val icon: Dp,
) {
    SM(36.dp, TextSize.sm, 10.dp, 16.dp),
    MD(40.dp, TextSize.md, 12.dp, 18.dp),
    LG(44.dp, TextSize.lg, 14.dp, 20.dp),
    XL(52.dp, TextSize.xl, 16.dp, 22.dp),
    X2L(64.dp, TextSize.x2l, 22.dp, 26.dp),
}

private data class ButtonColors(
    val fill: Color,
    val content: Color,
    val border: Color,
    val weight: FontWeight,
)

@Composable
private fun colorsFor(
    variant: Variant,
    pressed: Boolean,
): ButtonColors {
    val c = Titan.colors

    fun tinted(color: Color) =
        ButtonColors(
            if (pressed) color.copy(alpha = 0.8f) else color,
            c.background,
            Color.Transparent,
            FontWeight.SemiBold,
        )
    val ghostFill = if (pressed) c.alpha(c.foreground, 0.10) else Color.Transparent
    val ghostText = if (pressed) c.foreground else c.muted
    return when (variant) {
        Variant.PRIMARY -> {
            ButtonColors(c.primaryFill, c.foreground, Color.Transparent, FontWeight.Medium)
        }

        Variant.SOLID -> {
            ButtonColors(c.foreground, c.background, Color.Transparent, FontWeight.Medium)
        }

        Variant.GHOST -> {
            ButtonColors(ghostFill, ghostText, Color.Transparent, FontWeight.Medium)
        }

        Variant.OUTLINE -> {
            ButtonColors(
                ghostFill,
                ghostText,
                if (pressed) c.foreground else c.border,
                FontWeight.Medium,
            )
        }

        Variant.SUCCESS -> {
            tinted(c.success)
        }

        Variant.DANGER -> {
            tinted(c.danger)
        }

        Variant.WARNING -> {
            tinted(c.warning)
        }

        Variant.ACCENT -> {
            tinted(c.accent)
        }
    }
}

@Composable
fun TitanButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: Variant = Variant.PRIMARY,
    size: ControlSize = ControlSize.MD,
    enabled: Boolean = true,
    loading: Boolean = false,
    @DrawableRes icon: Int? = null,
    @DrawableRes trailingIcon: Int? = null,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val colors = colorsFor(variant, pressed)
    val active = enabled && !loading
    Row(
        modifier =
            modifier
                .heightIn(min = size.height)
                .alpha(if (active) 1f else 0.6f)
                .clip(Radii.lg)
                .background(colors.fill)
                .border(BorderStroke(1.dp, colors.border), Radii.lg)
                .clickable(interaction, null, enabled = active, role = Role.Button, onClick = onClick)
                .padding(horizontal = size.padding),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        icon?.let { TitanIcon(it, colors.content, size.icon) }
        Text(
            text,
            style = Titan.body(size.text, colors.weight),
            color = colors.content,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        trailingIcon?.let { TitanIcon(it, colors.content, size.icon) }
    }
}

/** An icon-only button (`label` set, no text). */
@Composable
fun TitanIconButton(
    @DrawableRes icon: Int,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: Variant = Variant.GHOST,
    size: ControlSize = ControlSize.MD,
    enabled: Boolean = true,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val colors = colorsFor(variant, pressed)
    Box(
        modifier =
            modifier
                .size(size.height)
                .alpha(if (enabled) 1f else 0.6f)
                .clip(Radii.lg)
                .background(colors.fill)
                .border(BorderStroke(1.dp, colors.border), Radii.lg)
                .clickable(
                    interaction,
                    null,
                    enabled = enabled,
                    role = Role.Button,
                    onClickLabel = label,
                    onClick = onClick,
                ),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            painterResource(icon),
            contentDescription = label,
            tint = colors.content,
            modifier = Modifier.size(size.icon),
        )
    }
}

@Composable
fun TitanIcon(
    @DrawableRes icon: Int,
    tint: Color,
    size: Dp = 18.dp,
    modifier: Modifier = Modifier,
) {
    Icon(painterResource(icon), contentDescription = null, tint = tint, modifier = modifier.size(size))
}

@Composable
fun Badge(
    text: String,
    tone: Tone,
    modifier: Modifier = Modifier,
) {
    val (fill, ink) = Titan.colors.badge(tone)
    Text(
        text,
        modifier = modifier.clip(Radii.full).background(fill).padding(horizontal = 8.dp, vertical = 2.dp),
        style = Titan.body(TextSize.xs, FontWeight.Medium),
        color = ink,
        maxLines = 1,
    )
}

fun toneOf(name: String): Tone =
    when (name) {
        "accent" -> Tone.ACCENT
        "success" -> Tone.SUCCESS
        "warning" -> Tone.WARNING
        "danger" -> Tone.DANGER
        else -> Tone.NEUTRAL
    }

/** The component library's `Card`: a bordered surface stacking its children. */
@Composable
fun TitanCard(
    modifier: Modifier = Modifier,
    title: String? = null,
    padding: PaddingValues = PaddingValues(16.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = Titan.colors
    Column(
        modifier =
            modifier
                .fillMaxWidth()
                .clip(Radii.lg)
                .background(c.card)
                .border(1.dp, c.border, Radii.lg)
                .padding(padding),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        title?.let { Text(it, style = Titan.body(TextSize.sm, FontWeight.SemiBold), color = c.foreground) }
        content()
    }
}

/** Small uppercase label above a value (`Eyebrow`). */
@Composable
fun Eyebrow(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Titan.colors.textTertiary,
) {
    Text(
        text.uppercase(),
        modifier = modifier,
        style = Titan.body(TextSize.xs, FontWeight.SemiBold).copy(letterSpacing = TextSize.xs * 0.08),
        color = color,
    )
}

@Composable
fun BodyText(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = Titan.colors.foreground,
    style: TextStyle = Titan.body(),
) {
    Text(text, modifier = modifier, style = style, color = color)
}

@Composable
fun MutedText(
    text: String,
    modifier: Modifier = Modifier,
    size: TextUnit = TextSize.sm,
) {
    Text(text, modifier = modifier, style = Titan.body(size), color = Titan.colors.muted)
}

@Composable
fun TitanTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboard: KeyboardType = KeyboardType.Text,
    supporting: String? = null,
    trailing: @Composable (() -> Unit)? = null,
) {
    val c = Titan.colors
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier.fillMaxWidth(),
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = keyboard),
        supportingText = supporting?.let { { Text(it) } },
        trailingIcon = trailing,
        shape = Radii.lg,
        textStyle = Titan.body(),
        colors =
            OutlinedTextFieldDefaults.colors(
                focusedBorderColor = c.accent,
                unfocusedBorderColor = c.border,
                focusedLabelColor = c.accent,
                unfocusedLabelColor = c.muted,
                cursorColor = c.accent,
            ),
    )
}

/** The web's `ModalDialog` with a title, body, and an action row. */
@Composable
fun TitanDialog(
    title: String,
    onDismiss: () -> Unit,
    actions: @Composable () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = Titan.colors
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = c.background,
        shape = Radii.xl,
        modifier = Modifier.widthIn(max = 520.dp).border(1.dp, c.border, Radii.xl),
        title = { Text(title, style = Titan.condensed(TextSize.x2l), color = c.foreground) },
        text = { Column(verticalArrangement = Arrangement.spacedBy(12.dp), content = content) },
        confirmButton = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { actions() }
        },
    )
}

/** A yes/no confirmation (`ConfirmDialog`), destructive by default. */
@Composable
fun ConfirmDialog(
    title: String,
    text: String,
    cancelLabel: String,
    confirmLabel: String,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
    confirmVariant: Variant = Variant.DANGER,
) {
    TitanDialog(
        title = title,
        onDismiss = onDismiss,
        actions = {
            TitanButton(cancelLabel, onDismiss, variant = Variant.GHOST)
            TitanButton(confirmLabel, {
                onConfirm()
                onDismiss()
            }, variant = confirmVariant)
        },
    ) {
        MutedText(text, size = TextSize.md)
    }
}

/** A row of mutually exclusive choices (`ToggleGroup`). */
@Composable
fun <T> ToggleGroup(
    options: List<Pair<T, String>>,
    selected: T,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = Titan.colors
    Row(
        modifier = modifier.clip(Radii.lg).border(1.dp, c.border, Radii.lg).padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        options.forEach { (value, label) ->
            val on = value == selected
            Box(
                modifier =
                    Modifier
                        .weight(1f)
                        .defaultMinSize(minHeight = 36.dp)
                        .clip(Radii.md)
                        .background(if (on) c.primaryFill else Color.Transparent)
                        .clickable(role = Role.RadioButton) { onSelect(value) }
                        .padding(horizontal = 8.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    style = Titan.body(TextSize.sm, FontWeight.Medium),
                    color = if (on) c.foreground else c.muted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}
