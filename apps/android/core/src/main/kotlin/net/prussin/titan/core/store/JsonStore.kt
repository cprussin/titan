package net.prussin.titan.core.store

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import net.prussin.titan.core.wire.WireJson
import java.io.File

/**
 * One JSON value in one file, written atomically (temp file + rename) so a
 * crash mid-write leaves the previous value intact. A file that no longer
 * decodes — an older app's shape — reads as absent rather than wedging the app.
 */
class JsonStore<T>(
    private val file: File,
    private val serializer: KSerializer<T>,
) {
    private val lock = Mutex()

    suspend fun read(): T? = lock.withLock { load() }

    suspend fun write(value: T?) {
        lock.withLock { save(value) }
    }

    /** Read-modify-write under one lock. */
    suspend fun update(transform: (T?) -> T?): T? =
        lock.withLock {
            val next = transform(load())
            save(next)
            next
        }

    private suspend fun load(): T? =
        withContext(Dispatchers.IO) {
            if (file.exists()) {
                try {
                    WireJson.decodeFromString(serializer, file.readText())
                } catch (_: SerializationException) {
                    null
                } catch (_: IllegalArgumentException) {
                    null
                }
            } else {
                null
            }
        }

    private suspend fun save(value: T?) {
        withContext(Dispatchers.IO) {
            if (value == null) {
                file.delete()
            } else {
                file.parentFile?.mkdirs()
                val temp = File(file.parentFile, "${file.name}.tmp")
                temp.writeText(WireJson.encodeToString(serializer, value))
                check(temp.renameTo(file)) { "could not replace ${file.path}" }
            }
        }
    }
}

/** A directory of [JsonStore]s keyed by name — the offline view cache. */
class JsonStoreDirectory(
    private val directory: File,
) {
    fun <T> store(
        key: String,
        serializer: KSerializer<T>,
    ): JsonStore<T> = JsonStore(File(directory, "${key.replace(Regex("[^A-Za-z0-9._-]"), "_")}.json"), serializer)

    suspend fun clear() {
        withContext(Dispatchers.IO) { directory.deleteRecursively() }
    }
}
