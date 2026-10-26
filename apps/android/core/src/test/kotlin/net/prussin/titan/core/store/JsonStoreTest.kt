package net.prussin.titan.core.store

import kotlinx.coroutines.test.runTest
import kotlinx.serialization.builtins.serializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File

class JsonStoreTest {
    @TempDir
    lateinit var dir: File

    @Test
    fun `round-trips, updates, and clears a value`() =
        runTest {
            val store = JsonStore(File(dir, "n.json"), Int.serializer())
            assertNull(store.read())
            store.write(1)
            assertEquals(2, store.update { (it ?: 0) + 1 })
            assertEquals(2, JsonStore(File(dir, "n.json"), Int.serializer()).read())
            store.write(null)
            assertNull(store.read())
        }

    @Test
    fun `reads an undecodable file as absent`() =
        runTest {
            File(dir, "bad.json").writeText("{not json")
            assertNull(JsonStore(File(dir, "bad.json"), Int.serializer()).read())
        }
}
