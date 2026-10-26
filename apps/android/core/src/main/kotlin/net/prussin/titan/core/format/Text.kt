package net.prussin.titan.core.format

import net.prussin.titan.core.wire.BandLevel
import net.prussin.titan.core.wire.CardioResult
import net.prussin.titan.core.wire.ExerciseResult
import net.prussin.titan.core.wire.LoadUnit
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.wire.SetResult

// Ports of the web's prescription/result text helpers (`prescription-text.ts`, `result-text.ts`, …).

data class PrescriptionParts(
    val primary: String,
    val recovery: String?,
)

fun prescriptionParts(prescription: Prescription): PrescriptionParts =
    when (prescription) {
        is Prescription.Strength -> {
            PrescriptionParts(
                "${prescription.sets}×${prescription.reps} @ ${formatWeight(prescription.weight, prescription.unit)}",
                null,
            )
        }

        is Prescription.Bodyweight -> {
            PrescriptionParts(
                "${prescription.sets}×${prescription.reps}${addedLoad(prescription.addedWeight, prescription.unit)}",
                null,
            )
        }

        is Prescription.Band -> {
            PrescriptionParts("${prescription.sets}×${prescription.reps}", null)
        }

        is Prescription.TimedHold -> {
            PrescriptionParts(
                "${prescription.sets}× ${jsNumber(prescription.holdSec)}s hold" +
                    addedLoad(prescription.addedWeight, prescription.unit),
                null,
            )
        }

        is Prescription.TimedCarry -> {
            PrescriptionParts(
                "${prescription.sets} × ${jsNumber(prescription.durationSec)}s @ " +
                    formatWeight(prescription.weight, prescription.unit),
                null,
            )
        }

        is Prescription.TimedEffort -> {
            PrescriptionParts(
                "${prescription.sets} × ${jsNumber(prescription.workSec)}s",
                "${formatClock(prescription.restSec)} rest",
            )
        }

        is Prescription.TimedCardio -> {
            val zone = prescription.targetHrZone?.let { " · Zone $it" } ?: ""
            PrescriptionParts("${formatMinutes(prescription.durationSec / 60)}$zone", null)
        }

        is Prescription.DistanceCardio -> {
            PrescriptionParts(
                "${formatDistance(prescription.distanceMeters)}${splitSuffix(prescription.targetSplitSecPer500)}",
                null,
            )
        }

        is Prescription.Intervals -> {
            PrescriptionParts(
                "${prescription.count} × ${intervalWork(
                    prescription,
                )}${splitSuffix(prescription.targetSplitSecPer500)}",
                "${formatClock(prescription.recoverySec)} recovery",
            )
        }

        is Prescription.Circuit -> {
            PrescriptionParts(
                "${prescription.rounds} rounds · ${prescription.stations.size} stations · " +
                    "${formatClock(prescription.restSec)} rest",
                null,
            )
        }
    }

fun describePrescription(prescription: Prescription): String {
    val (primary, recovery) = prescriptionParts(prescription)
    return if (recovery == null) primary else "$primary · $recovery"
}

private fun addedLoad(
    added: Double?,
    unit: LoadUnit,
): String = if (added == null || added == 0.0) "" else " +${jsNumber(added)} ${unit.label}"

private fun splitSuffix(split: Double?): String = split?.let { " @ ${formatSplit(it)}" } ?: ""

private fun intervalWork(prescription: Prescription.Intervals): String =
    prescription.workDistanceMeters?.let { formatDistance(it) } ?: "${jsNumber(prescription.workSec ?: 0.0)}s"

/** The plan grid's two columns (`prescription-columns.ts`). */
data class PrescriptionColumns(
    val load: String?,
    val scheme: String,
)

fun prescriptionColumns(prescription: Prescription): PrescriptionColumns =
    when (prescription) {
        is Prescription.Strength -> {
            PrescriptionColumns(
                formatWeight(prescription.weight, prescription.unit),
                "${prescription.sets}×${prescription.reps}",
            )
        }

        is Prescription.Bodyweight -> {
            val added = addedLoad(prescription.addedWeight, prescription.unit)
            PrescriptionColumns(
                if (added ==
                    ""
                ) {
                    "Bodyweight"
                } else {
                    added.trimStart()
                },
                "${prescription.sets}×${prescription.reps}",
            )
        }

        is Prescription.Band -> {
            PrescriptionColumns("Band", "${prescription.sets}×${prescription.reps}")
        }

        is Prescription.TimedHold -> {
            PrescriptionColumns(
                "${jsNumber(prescription.holdSec)}s hold${addedLoad(prescription.addedWeight, prescription.unit)}",
                "${prescription.sets}×",
            )
        }

        is Prescription.TimedCarry -> {
            PrescriptionColumns(
                formatWeight(prescription.weight, prescription.unit),
                "${prescription.sets} × ${jsNumber(prescription.durationSec)}s",
            )
        }

        is Prescription.TimedEffort -> {
            PrescriptionColumns(
                "${formatClock(prescription.restSec)} rest",
                "${prescription.sets} × ${jsNumber(prescription.workSec)}s",
            )
        }

        is Prescription.TimedCardio -> {
            PrescriptionColumns(
                prescription.targetHrZone?.let { "Zone $it" },
                formatMinutes(prescription.durationSec / 60),
            )
        }

        is Prescription.DistanceCardio -> {
            PrescriptionColumns(
                prescription.targetSplitSecPer500?.let(::formatSplit),
                formatDistance(prescription.distanceMeters),
            )
        }

        is Prescription.Intervals -> {
            PrescriptionColumns(
                prescription.targetSplitSecPer500?.let(::formatSplit),
                "${prescription.count} × ${intervalWork(prescription)}",
            )
        }

        is Prescription.Circuit -> {
            PrescriptionColumns("${prescription.stations.size} stations", "${prescription.rounds} rounds")
        }
    }

fun bandLabel(bands: List<BandLevel>): String = bands.joinToString(" + ") { it.label }

fun cardioSummary(cardio: CardioResult): String {
    val parts =
        listOfNotNull(
            cardio.distanceMeters?.let(::formatDistance),
            cardio.durationSec?.let(::formatDuration),
            cardio.splitSecPer500?.let(::formatSplit),
            cardio.avgHr?.let { "${jsNumber(it)} bpm" },
        )
    return if (parts.isEmpty()) "—" else parts.joinToString(" · ")
}

data class LoggedLine(
    val label: String,
    val value: String,
)

/** One line per logged set, or one cardio summary line (`loggedExerciseLines`). */
fun loggedExerciseLines(
    prescription: Prescription,
    sets: List<SetResult>,
    cardio: CardioResult?,
): List<LoggedLine> =
    when (prescription) {
        is Prescription.Strength -> {
            setLines(sets) { strengthSet(it, prescription.unit) }
        }

        is Prescription.Bodyweight -> {
            setLines(sets, ::repSet)
        }

        is Prescription.Band -> {
            setLines(sets, ::bandSet)
        }

        is Prescription.TimedHold -> {
            setLines(sets) { "${jsNumber(required(it.holdSec, "holdSec"))}s hold" }
        }

        is Prescription.TimedCarry -> {
            setLines(sets) { carrySet(it, prescription.unit) }
        }

        is Prescription.TimedEffort -> {
            setLines(sets, ::effortSet)
        }

        is Prescription.TimedCardio,
        is Prescription.DistanceCardio,
        is Prescription.Intervals,
        is Prescription.Circuit,
        -> {
            listOf(
                LoggedLine(
                    "",
                    cardioSummary(
                        checkNotNull(cardio) {
                            "a cardio exercise result is missing its effort summary"
                        },
                    ),
                ),
            )
        }
    }

private fun setLines(
    sets: List<SetResult>,
    describe: (SetResult) -> String,
): List<LoggedLine> = sets.mapIndexed { index, set -> LoggedLine("Set ${index + 1}", describe(set)) }

private fun strengthSet(
    set: SetResult,
    unit: LoadUnit,
): String = "${required(set.reps, "reps")} × ${formatWeight(required(set.weight, "weight"), unit)}"

private fun repSet(set: SetResult): String = "${required(set.reps, "reps")} reps"

private fun bandSet(set: SetResult): String = set.bands?.let { "${repSet(set)} · ${bandLabel(it)}" } ?: repSet(set)

private fun effortSet(set: SetResult): String {
    val work = "${jsNumber(required(set.durationSec, "durationSec"))}s work"
    return set.reps?.let { "$it reps · $work" } ?: work
}

private fun carrySet(
    set: SetResult,
    unit: LoadUnit,
): String = "${jsNumber(
    required(set.durationSec, "durationSec"),
)} sec × ${formatWeight(required(set.weight, "weight"), unit)}"

private fun <T : Any> required(
    value: T?,
    name: String,
): T = checkNotNull(value) { "logged set is missing its $name" }

/** "Last time: …" — the best set of the previous session (`describePreviousPerformance`). */
fun describePreviousPerformance(result: ExerciseResult): String? {
    val sets = result.sets
    return when (val prescription = result.prescription) {
        is Prescription.Strength -> {
            topBy(sets.filter { it.reps != null && it.weight != null }, { it.weight!! }, { it.reps!!.toDouble() })
                ?.let { "${it.reps} × ${formatWeight(it.weight!!, prescription.unit)}" }
        }

        is Prescription.Bodyweight -> {
            topBy(sets, { (it.reps ?: 0).toDouble() })?.takeIf { it.reps != null }?.let {
                "${it.reps} reps${addedFormatted(prescription.addedWeight, prescription.unit)}"
            }
        }

        is Prescription.Band -> {
            topBy(sets, { (it.reps ?: 0).toDouble() })?.takeIf { it.reps != null }?.let { top ->
                "${top.reps} reps${top.bands?.let { " · ${bandLabel(it)}" } ?: ""}"
            }
        }

        is Prescription.TimedHold -> {
            topBy(sets, { it.holdSec ?: 0.0 })?.takeIf { it.holdSec != null }?.let {
                "${jsNumber(it.holdSec!!)}s${addedFormatted(prescription.addedWeight, prescription.unit)}"
            }
        }

        is Prescription.TimedCarry -> {
            topBy(
                sets.filter { it.durationSec != null && it.weight != null },
                { it.durationSec!! },
                { it.weight!! },
            )?.let { "${jsNumber(it.durationSec!!)} sec × ${formatWeight(it.weight!!, prescription.unit)}" }
        }

        is Prescription.TimedEffort -> {
            topBy(sets, { (it.reps ?: 0).toDouble() }, { it.durationSec ?: 0.0 })?.let { top ->
                val seconds = top.durationSec
                when {
                    seconds == null -> null
                    top.reps == null -> "${jsNumber(seconds)}s"
                    else -> "${top.reps} reps · ${jsNumber(seconds)}s"
                }
            }
        }

        is Prescription.TimedCardio,
        is Prescription.DistanceCardio,
        is Prescription.Intervals,
        is Prescription.Circuit,
        -> {
            null
        }
    }
}

private fun addedFormatted(
    added: Double?,
    unit: LoadUnit,
): String = if (added == null || added == 0.0) "" else " +${formatWeight(added, unit)}"

private fun topBy(
    sets: List<SetResult>,
    primary: (SetResult) -> Double,
    secondary: (SetResult) -> Double = { 0.0 },
): SetResult? =
    sets.fold(null as SetResult?) { best, set ->
        if (best == null ||
            primary(set) > primary(best) ||
            (primary(set) == primary(best) && secondary(set) > secondary(best))
        ) {
            set
        } else {
            best
        }
    }

/** Badge tone per slot role (`role-tone.ts`). */
enum class Tone { ACCENT, SUCCESS, WARNING, DANGER, NEUTRAL }

fun roleTone(role: String): Tone =
    when (role) {
        "primary" -> Tone.ACCENT
        "secondary" -> Tone.SUCCESS
        "accessory" -> Tone.WARNING
        else -> Tone.NEUTRAL
    }
