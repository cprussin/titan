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
import net.prussin.titan.auth.GoogleAccount
import net.prussin.titan.auth.pickGoogleAccount
import net.prussin.titan.core.api.HttpException
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.core.auth.Pkce
import net.prussin.titan.core.auth.handoffFrom
import net.prussin.titan.core.wire.TokenResponse
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
            uri.contains("error=forbidden") -> signInError.value = FORBIDDEN
            uri.contains("error=") -> signInError.value = FAILED
            else -> handoffFrom(uri)?.let(::redeem)
        }
    }

    /** Sign in with an account on the device, falling back to the browser
     *  when in-app sign-in isn't available. */
    private fun signIn(baseUrl: String) {
        graph.session.setBaseUrl(baseUrl)
        signInError.value = null
        signingIn.value = true
        lifecycleScope.launch {
            val account =
                try {
                    pickGoogleAccount(this@MainActivity, graph.api.appConfig().googleClientId)
                } catch (_: Exception) {
                    GoogleAccount.Unavailable
                }
            when (account) {
                is GoogleAccount.Picked -> {
                    complete { graph.api.signInWithGoogle(account.idToken) }
                }

                GoogleAccount.Cancelled -> {
                    signingIn.value = false
                }

                GoogleAccount.Unavailable -> {
                    signingIn.value = false
                    browserSignIn()
                }
            }
        }
    }

    private fun browserSignIn() {
        val pkce = Pkce.create()
        graph.session.pendingVerifier = pkce.verifier
        CustomTabsIntent
            .Builder()
            .build()
            .launchUrl(this, Uri.parse(TitanApi.signInUrl(graph.session.baseUrl, pkce.challenge)))
    }

    private fun redeem(handoff: String) {
        val verifier = graph.session.pendingVerifier ?: return
        signingIn.value = true
        lifecycleScope.launch { complete { graph.api.redeemHandoff(handoff, verifier) } }
    }

    private suspend fun complete(signIn: suspend () -> TokenResponse) {
        try {
            val response = signIn()
            graph.session.signIn(response.token, response.user.email)
            Reminders.schedule(this@MainActivity)
            graph.sync.syncNow()
            graph.repository.refreshPlan()
        } catch (error: HttpException) {
            signInError.value =
                if (error.code == 403) FORBIDDEN else FAILED
        } catch (_: Exception) {
            signInError.value = FAILED
        } finally {
            signingIn.value = false
        }
    }

    companion object {
        const val EXTRA_OPEN = "net.prussin.titan.OPEN"
        const val OPEN_WORKOUT = "workout"
        const val OPEN_WEIGH_IN = "weigh-in"
        private const val FORBIDDEN = "That Google account isn't allowed to sign in."
        private const val FAILED = "Sign-in failed. Please try again."
    }
}
