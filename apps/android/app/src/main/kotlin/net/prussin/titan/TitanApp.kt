package net.prussin.titan

import android.app.Application
import android.net.ConnectivityManager
import android.net.Network
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import net.prussin.titan.core.api.OkHttpTransport
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.core.store.JsonStore
import net.prussin.titan.core.store.JsonStoreDirectory
import net.prussin.titan.core.sync.Outbox
import net.prussin.titan.core.sync.SyncEngine
import net.prussin.titan.core.workout.WorkoutRun
import net.prussin.titan.data.Repository
import net.prussin.titan.data.SessionStore
import net.prussin.titan.data.SyncCoordinator
import net.prussin.titan.reminder.Reminders
import net.prussin.titan.workout.WorkoutController
import net.prussin.titan.workout.WorkoutService
import java.io.File

/** Everything the app shares, built once per process. */
class AppGraph(
    app: Application,
) {
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    val session = SessionStore(app)
    val api = TitanApi(OkHttpTransport(session))
    val outbox = Outbox(JsonStore(File(app.filesDir, "outbox.json"), Outbox.serializer))
    val repository = Repository(api, JsonStoreDirectory(File(app.filesDir, "cache"))) { signOut() }
    val workout =
        WorkoutController(
            app,
            JsonStore(File(app.filesDir, "workout.json"), WorkoutRun.serializer()),
            outbox,
            repository,
            scope,
        )
    val sync =
        SyncCoordinator(app, SyncEngine(api, outbox)) { report ->
            workout.onReport(report)
            if (report.unauthorized) signOut()
        }
    val context: android.content.Context = app

    init {
        workout.sync = sync
    }

    /** The token was refused or the user logged out: forget the account's cached views. */
    fun signOut() {
        session.signOut()
        Reminders.schedule(context)
        scope.launch { repository.clear() }
    }
}

class TitanApp : Application() {
    lateinit var graph: AppGraph
        private set

    override fun onCreate() {
        super.onCreate()
        graph = AppGraph(this)
        WorkoutService.ensureChannel(this)
        Reminders.ensureChannel(this)
        Reminders.schedule(this)
        graph.scope.launch { graph.workout.restore() }
        // Back online: send what queued up and refresh the week's prescriptions.
        getSystemService(ConnectivityManager::class.java).registerDefaultNetworkCallback(
            object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    graph.scope.launch {
                        if (graph.session.signedIn.value) {
                            graph.sync.syncNow()
                            graph.repository.refreshPlan()
                            graph.repository.invalidate()
                        }
                    }
                }
            },
        )
    }
}
