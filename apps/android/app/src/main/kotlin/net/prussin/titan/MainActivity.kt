package net.prussin.titan

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.core.auth.Pkce
import net.prussin.titan.core.auth.handoffFrom
import net.prussin.titan.reminder.Reminders
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.TitanAppUi
import net.prussin.titan.ui.screens.SignInScreen
import net.prussin.titan.ui.theme.TitanTheme
import net.prussin.titan.workout.WorkoutService

class MainActivity : ComponentActivity() {
    private val graph get() = (application as TitanApp).graph

    /** A page a notification asked to open. */
    private val open = mutableStateOf<String?>(null)
    private val signInError = mutableStateOf<String?>(null)
    private val signingIn = mutableStateOf(false)

    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        handle(intent)
        setContent {
            val theme by graph.session.theme.collectAsState()
            val signedIn by graph.session.signedIn.collectAsState()
            TitanTheme(theme) {
                CompositionLocalProvider(LocalGraph provides graph) {
                    if (signedIn) {
                        TitanAppUi(open)
                    } else {
                        SignInScreen(signInError.value, signingIn.value, ::signIn)
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handle(intent)
    }

    override fun onResume() {
        super.onResume()
        if (graph.workout.run.value != null) WorkoutService.start(this)
        if (graph.session.signedIn.value &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private fun handle(intent: Intent?) {
        intent?.getStringExtra(EXTRA_OPEN)?.let {
            open.value = it
            intent.removeExtra(EXTRA_OPEN)
        }
        val uri = intent?.data?.toString() ?: return
        intent.data = null
        when {
            uri.contains("error=forbidden") -> signInError.value = "That Google account isn't allowed to sign in."
            uri.contains("error=") -> signInError.value = "Sign-in failed. Please try again."
            else -> handoffFrom(uri)?.let(::redeem)
        }
    }

    private fun signIn(baseUrl: String) {
        graph.session.setBaseUrl(baseUrl)
        val pkce = Pkce.create()
        graph.session.pendingVerifier = pkce.verifier
        signInError.value = null
        CustomTabsIntent
            .Builder()
            .build()
            .launchUrl(this, Uri.parse(TitanApi.signInUrl(graph.session.baseUrl, pkce.challenge)))
    }

    private fun redeem(handoff: String) {
        val verifier = graph.session.pendingVerifier ?: return
        signingIn.value = true
        lifecycleScope.launch {
            try {
                val response = graph.api.redeemHandoff(handoff, verifier)
                graph.session.signIn(response.token, response.user.email)
                Reminders.schedule(this@MainActivity)
                graph.sync.syncNow()
                graph.repository.refreshPlan()
            } catch (_: Exception) {
                signInError.value = "Sign-in failed. Please try again."
            } finally {
                signingIn.value = false
            }
        }
    }

    companion object {
        const val EXTRA_OPEN = "net.prussin.titan.OPEN"
        const val OPEN_WORKOUT = "workout"
        const val OPEN_WEIGH_IN = "weigh-in"
    }
}
