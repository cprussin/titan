package net.prussin.titan.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import net.prussin.titan.core.format.prescriptionColumns
import net.prussin.titan.core.theme.mix
import net.prussin.titan.core.wire.LoggedExercise
import net.prussin.titan.core.wire.PrescribedExercise
import net.prussin.titan.ui.LocalWide
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

/** A grid header row, ruled in accent like the web's. */
@Composable
private fun HeaderRow(
    headers: List<String>,
    widths: List<Dp>,
) {
    val c = Titan.colors
    Row(Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        headers.forEachIndexed { i, header ->
            val cell = if (i == 0) Modifier.weight(1f) else Modifier.width(widths[i - 1])
            Text(
                header.uppercase(),
                cell,
                style = Titan.body(TextSize.xs, FontWeight.Bold).copy(letterSpacing = TextSize.xs * 0.05),
                color = c.textTertiary,
                textAlign = if (i == 0) TextAlign.Start else TextAlign.End,
                maxLines = 1,
            )
        }
    }
    HorizontalDivider(
        color =
            androidx.compose.ui.graphics
                .Color(mix(c.palette.accent, 0.35, c.palette.border)),
    )
}

@Composable
private fun NameCell(
    name: String,
    tag: String?,
    modifier: Modifier,
) {
    val c = Titan.colors
    Text(
        buildAnnotatedString {
            append(name)
            tag?.let {
                withStyle(
                    SpanStyle(
                        color = c.textTertiary,
                        fontFamily = Titan.body().fontFamily,
                        fontSize = TextSize.xs,
                        fontWeight = FontWeight.Bold,
                    ),
                ) { append("  ${it.uppercase()}") }
            }
        },
        modifier,
        style = Titan.condensed(TextSize.xl),
        color = c.foreground,
    )
}

/** The day's prescription (`PrescriptionGrid`). */
@Composable
fun PrescriptionGrid(
    exercises: List<PrescribedExercise>,
    names: Map<String, String>,
    loadHeader: String,
) {
    val wide = LocalWide.current
    val widths = if (wide) listOf(150.dp, 180.dp) else listOf(64.dp, 88.dp)
    val c = Titan.colors
    val figure = Titan.mono(if (wide) TextSize.md else TextSize.sm, FontWeight.Medium)
    Column(Modifier.fillMaxWidth()) {
        HeaderRow(listOf("Exercise", "Sets × reps", loadHeader), widths)
        exercises.forEachIndexed { i, exercise ->
            if (i > 0) HorizontalDivider(color = c.border)
            val columns = prescriptionColumns(exercise.prescription)
            Row(
                Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                NameCell(
                    names[exercise.exerciseId] ?: exercise.exerciseId,
                    if (exercise.role == "primary") "Primary" else null,
                    Modifier.weight(1f),
                )
                Text(
                    columns.scheme,
                    Modifier.width(widths[0]),
                    style = figure,
                    color = c.foreground,
                    textAlign = TextAlign.End,
                )
                Text(
                    columns.load ?: "—",
                    Modifier.width(widths[1]),
                    style = figure.copy(fontWeight = FontWeight.SemiBold),
                    color = c.foreground,
                    textAlign = TextAlign.End,
                )
            }
        }
    }
}

/** A logged day (`LogGrid`): prescribed against done, done in success when met. */
@Composable
fun LogGrid(exercises: List<LoggedExercise>) {
    val wide = LocalWide.current
    val widths = if (wide) listOf(150.dp, 150.dp, 90.dp) else listOf(64.dp, 64.dp, 44.dp)
    val c = Titan.colors
    val figure = Titan.mono(if (wide) TextSize.md else TextSize.sm, FontWeight.Medium)
    Column(Modifier.fillMaxWidth()) {
        HeaderRow(listOf("Exercise", "Prescribed", "Done", if (wide) "Avg RPE" else "RPE"), widths)
        exercises.forEachIndexed { i, exercise ->
            if (i > 0) HorizontalDivider(color = c.border)
            Row(
                Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                NameCell(exercise.name, if (exercise.isPrimary) "Primary" else null, Modifier.weight(1f))
                Text(
                    exercise.prescribed,
                    Modifier.width(widths[0]),
                    style = figure,
                    color = c.muted,
                    textAlign = TextAlign.End,
                )
                Text(
                    exercise.done,
                    Modifier.width(widths[1]),
                    style = figure.copy(fontWeight = FontWeight.SemiBold),
                    color = if (exercise.isAsPrescribed) c.success else c.foreground,
                    textAlign = TextAlign.End,
                )
                Text(
                    exercise.avgRpe ?: "—",
                    Modifier.width(widths[2]),
                    style = figure,
                    color = c.foreground,
                    textAlign = TextAlign.End,
                )
            }
        }
    }
}

/** The engine's notes beside a grid (`NoteAside`). */
@Composable
fun NoteAside(notes: List<String>) {
    if (notes.isEmpty()) return
    val c = Titan.colors
    val rule =
        androidx.compose.ui.graphics
            .Color(mix(c.palette.accent, 0.35, c.palette.border))
    Column(
        Modifier
            .fillMaxWidth()
            .drawBehind { drawLine(rule, Offset(0f, 0f), Offset(0f, size.height), strokeWidth = 1.dp.toPx()) }
            .padding(start = 14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        notes.forEach { MutedText(it) }
    }
}
