package net.prussin.titan.data

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import net.prussin.titan.TitanApp
import net.prussin.titan.core.sync.SyncEngine
import net.prussin.titan.core.sync.SyncReport

/**
 * Drains the outbox now, one drain at a time, and hands what it found to the
 * workout controller. When the server is out of reach, WorkManager retries
 * once the phone is back online — even with the app closed.
 */
class SyncCoordinator(
    private val context: Context,
    private val engine: SyncEngine,
    private val onReport: suspend (SyncReport) -> Unit,
) {
    private val lock = Mutex()

    /** [retryLater]: hand an unfinished drain to WorkManager (the worker itself retries instead). */
    suspend fun syncNow(retryLater: Boolean = true): SyncReport =
        lock.withLock {
            val report = engine.drain()
            onReport(report)
            if (retryLater && !report.drained && !report.unauthorized) schedule()
            report
        }

    fun schedule() {
        val request =
            OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
        WorkManager.getInstance(context).enqueueUniqueWork(WORK, ExistingWorkPolicy.REPLACE, request)
    }

    private companion object {
        const val WORK = "titan-sync"
    }
}

class SyncWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val graph = (applicationContext as TitanApp).graph
        val report = graph.sync.syncNow(retryLater = false)
        if (report.drained) graph.repository.refreshPlan()
        return if (report.drained || report.unauthorized) Result.success() else Result.retry()
    }
}
