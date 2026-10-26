package net.prussin.titan.ui.workout

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import net.prussin.titan.R
import net.prussin.titan.core.format.bandLabel
import net.prussin.titan.core.format.formatDuration
import net.prussin.titan.core.format.jsNumber
import net.prussin.titan.core.format.parseDuration
import net.prussin.titan.core.format.parseFieldValue
import net.prussin.titan.core.wire.BandLevel
import net.prussin.titan.core.wire.LoadUnit
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.workout.WorkoutRun
import net.prussin.titan.core.workout.loadUnitOf
import net.prussin.titan.core.workout.loggedSeconds
import net.prussin.titan.core.workout.logsLoad
import net.prussin.titan.core.workout.logsReps
import net.prussin.titan.core.workout.secondsNoun
import net.prussin.titan.core.workout.withSeconds
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.Eyebrow
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanIconButton
import net.prussin.titan.ui.components.TitanTextField
import net.prussin.titan.ui.components.ToggleGroup
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.theme.Radii
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan
import net.prussin.titan.workout.WorkoutController
import java.time.Instant
import java.util.UUID

/** A labelled number with coarse (and optionally fine) +/- controls (`Stepper`). */
@Composable
fun Stepper(
    label: String,
    value: Double,
    step: Double,
    onChange: (Double) -> Unit,
    fineStep: Double? = null,
) {
    val c = Titan.colors
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, style = Titan.body(TextSize.sm, FontWeight.Medium), color = c.muted)
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TitanIconButton(R.drawable.ph_minus, "Decrease $label", {
                onChange((value - step).coerceAtLeast(0.0))
            }, variant = Variant.OUTLINE, size = ControlSize.XL)
            fineStep?.let { fine ->
                TitanIconButton(R.drawable.ph_minus, "Fine decrease $label", {
                    onChange((value - fine).coerceAtLeast(0.0))
                }, variant = Variant.OUTLINE, size = ControlSize.SM)
            }
            NumberField(value, onChange, Modifier.weight(1f))
            fineStep?.let { fine ->
                TitanIconButton(R.drawable.ph_plus, "Fine increase $label", {
                    onChange(value + fine)
                }, variant = Variant.OUTLINE, size = ControlSize.SM)
            }
            TitanIconButton(R.drawable.ph_plus, "Increase $label", {
                onChange(value + step)
            }, variant = Variant.OUTLINE, size = ControlSize.XL)
        }
    }
}

/** The stepper's typed value: edits commit as they parse, and the field resets to the value on blur. */
@Composable
private fun NumberField(
    value: Double,
    onChange: (Double) -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = Titan.colors
    var draft by remember { mutableStateOf(jsNumber(value)) }
    var focused by remember { mutableStateOf(false) }
    LaunchedEffect(value) { if (!focused || parseFieldValue(draft) != value) draft = jsNumber(value) }
    BasicTextField(
        draft,
        { text ->
            draft = text
            parseFieldValue(text)?.let(onChange)
        },
        modifier
            .height(52.dp)
            .border(BorderStroke(1.dp, if (focused) c.accent else c.border), Radii.lg)
            .onFocusChanged {
                focused = it.isFocused
                if (!it.isFocused) draft = jsNumber(value)
            }.padding(top = 10.dp),
        textStyle =
            Titan
                .mono(
                    TextSize.x2l,
                    FontWeight.SemiBold,
                ).copy(color = c.foreground, textAlign = TextAlign.Center),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        singleLine = true,
        cursorBrush = SolidColor(c.accent),
    )
}

/** A logged set's compact editor (`MiniStepper`). */
@Composable
private fun MiniStepper(
    label: String,
    value: Double,
    step: Double,
    suffix: String?,
    onChange: (Double) -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        TitanIconButton(R.drawable.ph_minus, "Decrease $label", {
            onChange((value - step).coerceAtLeast(0.0))
        }, size = ControlSize.SM)
        Text(
            jsNumber(value) + (suffix?.let { " $it" } ?: ""),
            Modifier.widthIn(min = 40.dp),
            style = Titan.mono(TextSize.sm, FontWeight.Medium),
            color = Titan.colors.foreground,
            textAlign = TextAlign.Center,
        )
        TitanIconButton(R.drawable.ph_plus, "Increase $label", { onChange(value + step) }, size = ControlSize.SM)
    }
}

/** Rate of perceived exertion, 1–10 (`RpePicker`). */
@Composable
private fun RpePicker(
    value: Int?,
    onChange: (Int) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row {
            Text(
                "RPE",
                Modifier.weight(1f),
                style = Titan.body(TextSize.sm, FontWeight.Medium),
                color = Titan.colors.muted,
            )
            Text(
                value?.toString() ?: "—",
                style = Titan.mono(TextSize.sm, FontWeight.SemiBold),
                color = Titan.colors.foreground,
            )
        }
        ToggleGroup((1..10).map { it to it.toString() }, value ?: 0, onChange, Modifier.fillMaxWidth())
    }
}

/** The band stack for the set (`BandPicker`). */
@Composable
private fun BandPicker(
    value: List<BandLevel>?,
    onChange: (List<BandLevel>?) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Band", style = Titan.body(TextSize.sm, FontWeight.Medium), color = Titan.colors.muted)
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            val options = listOf<List<BandLevel>?>(null) + BandLevel.COMBINATIONS
            options.forEach { bands ->
                TitanButton(
                    bands?.let(::bandLabel) ?: "Not recorded",
                    { onChange(bands) },
                    variant = if (bands == value) Variant.ACCENT else Variant.OUTLINE,
                    size = ControlSize.SM,
                )
            }
        }
    }
}

/** The set-based logger's fields (`StrengthLogger`). */
@Composable
fun StrengthFields(
    run: WorkoutRun,
    prescription: Prescription.SetBased,
    controller: WorkoutController,
) {
    val c = Titan.colors
    val unit: LoadUnit? = loadUnitOf(prescription)
    val draft = run.setDraft ?: return
    val done = run.logged.size
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (done > 0) {
            Eyebrow("Logged")
            run.logged.forEachIndexed { index, set ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Set ${index + 1}", Modifier.weight(1f), style = Titan.body(TextSize.sm), color = c.muted)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (logsLoad(prescription)) {
                            MiniStepper(
                                "set ${index + 1} weight",
                                set.weight ?: 0.0,
                                LoadUnit.COARSE_STEP,
                                unit?.label,
                            ) { v ->
                                controller.apply { it.editSet(index, set.copy(weight = v)) }
                            }
                        }
                        if (prescription is Prescription.Timed) {
                            MiniStepper(
                                "set ${index + 1} ${secondsNoun(prescription).lowercase()}",
                                loggedSeconds(set) ?: 0.0,
                                5.0,
                                "s",
                            ) { v -> controller.apply { it.editSet(index, withSeconds(prescription, set, v)) } }
                        }
                        if (logsReps(prescription)) {
                            MiniStepper("set ${index + 1} reps", (set.reps ?: 0).toDouble(), 1.0, null) { v ->
                                controller.apply { it.editSet(index, set.copy(reps = v.toInt())) }
                            }
                        }
                    }
                }
            }
            HorizontalDivider(color = c.border)
        }
        Text(
            if (done >= prescription.sets) "All sets logged" else "Set ${done + 1} of ${prescription.sets}",
            style = Titan.condensed(TextSize.x2l),
            color = c.foreground,
        )
        if (done < prescription.sets) {
            unit?.let {
                Stepper("Weight (${it.label})", draft.weight, LoadUnit.COARSE_STEP, { v ->
                    controller.update { r ->
                        r.withDraft { d -> d.copy(weight = v) }
                    }
                }, it.fineStep)
            }
            if (prescription is Prescription.Band) {
                BandPicker(draft.bands) { bands -> controller.update { r -> r.withDraft { it.copy(bands = bands) } } }
            }
            if (prescription is Prescription.Timed) {
                EffortFor(run, controller)
                Stepper("${secondsNoun(prescription)} (sec)", draft.seconds, 5.0, { v ->
                    controller.update { r ->
                        r.withDraft { it.copy(seconds = v) }
                    }
                })
            }
            if (logsReps(prescription)) {
                Stepper("Reps", draft.reps.toDouble(), 1.0, { v ->
                    controller.update { r ->
                        r.withDraft { it.copy(reps = v.toInt()) }
                    }
                })
            }
            RpePicker(draft.rpe) { rpe -> controller.update { r -> r.withDraft { it.copy(rpe = rpe) } } }
        }
    }
}

/** The bar pinned under the logger: Back, Finish early / Complete exercise, Log set. */
@Composable
fun StrengthBar(
    run: WorkoutRun,
    prescription: Prescription.SetBased,
    controller: WorkoutController,
) {
    val done = run.logged.size
    val finished = done >= prescription.sets
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        if (done > 0) {
            TitanButton("Back", {
                controller.apply { it.undoLastSet() }
            }, Modifier.weight(1f), variant = Variant.OUTLINE, size = ControlSize.XL)
        }
        TitanButton(
            if (finished) "Complete exercise" else "Finish early",
            { controller.apply { it.completeSets(UUID.randomUUID().toString(), Instant.now().toString()) } },
            Modifier.weight(1f),
            variant = if (finished) Variant.SUCCESS else Variant.OUTLINE,
            size = ControlSize.XL,
            enabled = done > 0,
        )
        if (!finished) {
            TitanButton(
                "Log set",
                { controller.apply { it.logSet(System.currentTimeMillis()) } },
                Modifier.weight(1f),
                variant = Variant.ACCENT,
                size = ControlSize.XL,
                enabled = run.setDraft?.rpe != null,
            )
        }
    }
}

@Composable
private fun EffortFor(
    run: WorkoutRun,
    controller: WorkoutController,
) {
    val effort = run.effort ?: return
    EffortTimerView(
        effort,
        onToggle = { controller.update { it.toggleEffort(System.currentTimeMillis()) } },
        onUse = { controller.update { it.useEffortTime(System.currentTimeMillis()) } },
        onReset = { controller.update { it.resetEffort() } },
    )
}

/** The cardio logger's fields (`CardioLogger`). */
@Composable
fun CardioFields(
    run: WorkoutRun,
    controller: WorkoutController,
) {
    val exercise = run.current ?: return
    val cardio = run.cardio
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (run.concept2Connected && run.modalities[exercise.exerciseId] == "rower") {
            Concept2Check(run, controller)
        }
        TitanTextField(cardio.distance, { v ->
            controller.update { r ->
                r.withCardio { it.copy(distance = v) }
            }
        }, "Distance (m)", keyboard = KeyboardType.Number)
        TitanTextField(
            cardio.duration,
            { v -> controller.update { r -> r.withCardio { it.copy(duration = v) } } },
            "Duration (m:ss)",
            supporting = parseDuration(cardio.duration)?.let(::formatDuration),
        )
        EffortFor(run, controller)
        TitanTextField(cardio.avgHr, { v ->
            controller.update { r ->
                r.withCardio { it.copy(avgHr = v) }
            }
        }, "Avg HR (optional)", keyboard = KeyboardType.Number)
    }
}

@Composable
fun CardioBar(controller: WorkoutController) {
    TitanButton(
        "Complete",
        { controller.apply { it.completeCardio(UUID.randomUUID().toString(), Instant.now().toString()) } },
        Modifier.fillMaxWidth(),
        variant = Variant.SUCCESS,
        size = ControlSize.XL,
    )
}

@Composable
fun NothingToLog() {
    MutedText("Nothing to do.", Modifier.padding(16.dp))
}
