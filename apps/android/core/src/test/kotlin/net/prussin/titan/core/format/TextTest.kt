package net.prussin.titan.core.format

import net.prussin.titan.core.wire.BandLevel
import net.prussin.titan.core.wire.CardioResult
import net.prussin.titan.core.wire.ExerciseResult
import net.prussin.titan.core.wire.LoadUnit
import net.prussin.titan.core.wire.Prescription
import net.prussin.titan.core.wire.SetResult
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class TextTest {
    @Test
    fun `describes prescriptions as the web does`() {
        assertEquals("5×5 @ 230 lb", describePrescription(Prescription.Strength(sets = 5, reps = 5, weight = 230.0)))
        assertEquals(
            "5×5 @ 100 kg",
            describePrescription(Prescription.Strength(sets = 5, reps = 5, weight = 100.0, unit = LoadUnit.KG)),
        )
        assertEquals(
            "3 × 40s @ 150 lb",
            describePrescription(Prescription.TimedCarry(sets = 3, durationSec = 40.0, weight = 150.0)),
        )
        assertEquals("3×10", describePrescription(Prescription.Band(sets = 3, reps = 10)))
        assertEquals(
            "4×6 +25 lb",
            describePrescription(Prescription.Bodyweight(sets = 4, reps = 6, addedWeight = 25.0)),
        )
        assertEquals(
            "3× 120s hold +5 kg",
            describePrescription(
                Prescription.TimedHold(sets = 3, holdSec = 120.0, addedWeight = 5.0, unit = LoadUnit.KG),
            ),
        )
        assertEquals(
            "6 × 45s · 1:15 rest",
            describePrescription(Prescription.TimedEffort(sets = 6, workSec = 45.0, restSec = 75.0)),
        )
        assertEquals(
            "6 × 500 m @ 1:45.0 /500m · 2:00 recovery",
            describePrescription(
                Prescription.Intervals(
                    count = 6,
                    recoverySec = 120.0,
                    targetSplitSecPer500 = 105.0,
                    workDistanceMeters = 500.0,
                ),
            ),
        )
        assertEquals(
            "20 min · Zone 1",
            describePrescription(Prescription.TimedCardio(durationSec = 1200.0, targetHrZone = 1)),
        )
    }

    @Test
    fun `splits prescriptions into grid columns`() {
        assertEquals(
            PrescriptionColumns(load = "Bodyweight", scheme = "3×5"),
            prescriptionColumns(Prescription.Bodyweight(sets = 3, reps = 5)),
        )
        assertEquals(
            PrescriptionColumns(load = null, scheme = "10,000 m"),
            prescriptionColumns(Prescription.DistanceCardio(distanceMeters = 10_000.0)),
        )
    }

    @Test
    fun `lists logged sets and cardio`() {
        val strength = Prescription.Strength(sets = 2, reps = 5, weight = 100.0)
        assertEquals(
            listOf(LoggedLine("Set 1", "5 × 100 lb"), LoggedLine("Set 2", "4 × 102.5 lb")),
            loggedExerciseLines(
                strength,
                listOf(
                    SetResult(setIndex = 0, completed = true, reps = 5, weight = 100.0),
                    SetResult(setIndex = 1, completed = true, reps = 4, weight = 102.5),
                ),
                null,
            ),
        )
        assertEquals(
            listOf(LoggedLine("Set 1", "8 reps · Green + Red")),
            loggedExerciseLines(
                Prescription.Band(sets = 1, reps = 8),
                listOf(
                    SetResult(setIndex = 0, completed = true, reps = 8, bands = listOf(BandLevel.GREEN, BandLevel.RED)),
                ),
                null,
            ),
        )
        assertEquals(
            listOf(LoggedLine("", "5,000 m · 21:00 · 2:06.0 /500m · 142 bpm")),
            loggedExerciseLines(
                Prescription.DistanceCardio(distanceMeters = 5000.0),
                emptyList(),
                CardioResult(distanceMeters = 5000.0, durationSec = 1260.0, splitSecPer500 = 126.0, avgHr = 142.0),
            ),
        )
        assertEquals("—", cardioSummary(CardioResult()))
    }

    @Test
    fun `summarizes the best previous set`() {
        val result =
            ExerciseResult(
                id = "r",
                exerciseId = "e",
                slotId = "s",
                prescription = Prescription.Strength(sets = 3, reps = 5, weight = 100.0),
                sets =
                    listOf(
                        SetResult(setIndex = 0, completed = true, reps = 5, weight = 100.0),
                        SetResult(setIndex = 1, completed = true, reps = 6, weight = 100.0),
                        SetResult(setIndex = 2, completed = true, reps = 3, weight = 95.0),
                    ),
            )
        assertEquals("6 × 100 lb", describePreviousPerformance(result))
        assertNull(
            describePreviousPerformance(result.copy(prescription = Prescription.TimedCardio(durationSec = 60.0))),
        )
    }
}
