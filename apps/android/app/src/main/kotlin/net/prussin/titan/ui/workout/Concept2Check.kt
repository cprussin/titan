package net.prussin.titan.ui.workout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import net.prussin.titan.R
import net.prussin.titan.core.format.cardioSummary
import net.prussin.titan.core.wire.Concept2Match
import net.prussin.titan.core.wire.NormalizedWorkout
import net.prussin.titan.core.workout.WorkoutRun
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanDialog
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan
import net.prussin.titan.workout.WorkoutController
import java.time.Instant
import java.util.UUID

private sealed interface Phase {
    data object Idle : Phase

    data class Choosing(
        val candidates: List<NormalizedWorkout>,
    ) : Phase

    data object Found : Phase

    data object NotFound : Phase

    data object Error : Phase
}

private const val POLL_INTERVAL_MS = 20_000L

/**
 * The Concept2 hand-off on a rowing piece (`Concept2Check`): polls quietly, and
 * logs the row the moment one matches; only a manual check reports "no match".
 */
@Composable
fun Concept2Check(
    run: WorkoutRun,
    controller: WorkoutController,
) {
    val api = LocalGraph.current.api
    val scope = rememberCoroutineScope()
    val slotId = run.current?.slotId ?: return
    var phase by remember(slotId) { mutableStateOf<Phase>(Phase.Idle) }
    var checking by remember(slotId) { mutableStateOf(false) }
    var polling by remember(slotId) { mutableStateOf(true) }

    fun found(normalized: NormalizedWorkout) {
        polling = false
        phase = Phase.Found
        controller.apply { it.completeImported(UUID.randomUUID().toString(), Instant.now().toString(), normalized) }
    }

    suspend fun check(manual: Boolean) {
        checking = true
        val result = runCatching { api.concept2Match(run.sessionId, slotId) }
        checking = false
        if (phase == Phase.Found) return
        result
            .onSuccess { match ->
                when (match) {
                    is Concept2Match.Matched -> {
                        found(match.normalized)
                    }

                    is Concept2Match.Ambiguous -> {
                        polling = false
                        phase = Phase.Choosing(match.candidates)
                    }

                    Concept2Match.NotMatched -> {
                        if (manual) phase = Phase.NotFound
                    }
                }
            }.onFailure { if (manual) phase = Phase.Error }
    }

    LaunchedEffect(slotId) {
        while (true) {
            if (polling) check(false)
            delay(POLL_INTERVAL_MS)
        }
    }
    val manual = { scope.launch { check(true) } }
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        when (val current = phase) {
            Phase.Idle -> {
                MutedText(if (checking) "Checking Concept2 for your row…" else "Rowed this on a Concept2?")
                TitanButton("Check Concept2", {
                    manual()
                }, variant = Variant.OUTLINE, loading = checking, icon = R.drawable.ph_magnifying_glass)
            }

            Phase.Found -> {
                Text(
                    "Workout found",
                    style = Titan.body(TextSize.md, FontWeight.SemiBold),
                    color = Titan.colors.success,
                )
            }

            Phase.NotFound, Phase.Error -> {
                MutedText(
                    if (current ==
                        Phase.NotFound
                    ) {
                        "No matching workout found, try again?"
                    } else {
                        "Couldn't reach Concept2. Try again?"
                    },
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TitanButton("Retry", { manual() }, variant = Variant.OUTLINE, loading = checking)
                    TitanButton("Cancel", { phase = Phase.Idle }, variant = Variant.GHOST, enabled = !checking)
                }
            }

            is Phase.Choosing -> {
                TitanDialog(
                    title = "Which row was this?",
                    onDismiss = { phase = Phase.Idle },
                    actions = { TitanButton("Not these", { phase = Phase.Idle }, variant = Variant.GHOST) },
                ) {
                    MutedText("More than one Concept2 row matches this piece.")
                    current.candidates.forEach { candidate ->
                        TitanButton(
                            "${candidate.workoutAt.drop(11).take(5)} · ${cardioSummary(candidate.summary)}",
                            { found(candidate) },
                            Modifier.fillMaxWidth(),
                            variant = Variant.OUTLINE,
                        )
                    }
                }
            }
        }
    }
}
