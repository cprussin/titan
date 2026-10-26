package net.prussin.titan.data

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.update
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import net.prussin.titan.core.api.HttpException
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.core.store.JsonStoreDirectory
import net.prussin.titan.core.wire.OfflinePlan
import java.io.IOException

enum class LoadStatus { LOADING, READY, OFFLINE, FAILED }

/** A view as last seen: the cached copy while loading, then the server's. */
data class Resource<T>(
    val value: T?,
    val status: LoadStatus,
)

/**
 * Reads go server-first with an on-disk fallback: every view is cached as it
 * arrives, so anything seen once still opens offline.
 */
class Repository(
    val api: TitanApi,
    private val cache: JsonStoreDirectory,
    private val onUnauthorized: () -> Unit,
) {
    private val version = MutableStateFlow(0)

    /** Bumped after every mutation and sync, so open screens refetch. */
    val changes: StateFlow<Int> = version.asStateFlow()

    fun invalidate() {
        version.update { it + 1 }
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    fun <T> observe(
        key: String,
        serializer: KSerializer<T>,
        fetch: suspend TitanApi.() -> T,
    ): Flow<Resource<T>> =
        version.flatMapLatest {
            flow {
                val store = cache.store(key, serializer)
                val cached = store.read()
                emit(Resource(cached, LoadStatus.LOADING))
                emit(
                    try {
                        val fresh = api.fetch()
                        store.write(fresh)
                        Resource(fresh, LoadStatus.READY)
                    } catch (_: IOException) {
                        Resource(cached, LoadStatus.OFFLINE)
                    } catch (error: HttpException) {
                        if (error.isUnauthorized) onUnauthorized()
                        Resource(cached, LoadStatus.FAILED)
                    } catch (_: SerializationException) {
                        Resource(cached, LoadStatus.FAILED)
                    },
                )
            }
        }

    /** Fetch once, caching, or fall back to the cache. */
    suspend fun <T> fetch(
        key: String,
        serializer: KSerializer<T>,
        fetch: suspend TitanApi.() -> T,
    ): T? {
        val store = cache.store(key, serializer)
        return try {
            api.fetch().also { store.write(it) }
        } catch (_: IOException) {
            store.read()
        } catch (error: HttpException) {
            if (error.isUnauthorized) onUnauthorized()
            store.read()
        }
    }

    suspend fun <T> cached(
        key: String,
        serializer: KSerializer<T>,
    ): T? = cache.store(key, serializer).read()

    /** The next week of prescriptions, for starting a workout offline. */
    suspend fun refreshPlan() {
        fetch(PLAN, OfflinePlan.serializer()) { plan(PLAN_DAYS) }
    }

    suspend fun plan(): OfflinePlan? = cached(PLAN, OfflinePlan.serializer())

    suspend fun clear() {
        cache.clear()
    }

    companion object {
        const val PLAN = "plan"
        const val PLAN_DAYS = 7
    }
}
