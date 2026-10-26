package net.prussin.titan.auth

import android.app.Activity
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/** What asking Android for a Google account came to. */
sealed interface GoogleAccount {
    data class Picked(
        val idToken: String,
    ) : GoogleAccount

    /** The athlete dismissed the account sheet. */
    data object Cancelled : GoogleAccount

    /** In-app sign-in isn't available (no account, or the app's Google client
     *  isn't set up for this signing key), so sign in through the browser. */
    data object Unavailable : GoogleAccount
}

/** Show the device's Google accounts and return an ID token issued to the
 *  server's [serverClientId], for `/api/v1/auth/app/google` to verify. */
suspend fun pickGoogleAccount(
    activity: Activity,
    serverClientId: String,
): GoogleAccount {
    val option =
        GetGoogleIdOption
            .Builder()
            .setServerClientId(serverClientId)
            .setFilterByAuthorizedAccounts(false)
            .setAutoSelectEnabled(true)
            .build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
    return try {
        val credential = CredentialManager.create(activity).getCredential(activity, request).credential
        if (credential is CustomCredential &&
            credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
        ) {
            GoogleAccount.Picked(GoogleIdTokenCredential.createFrom(credential.data).idToken)
        } else {
            GoogleAccount.Unavailable
        }
    } catch (_: GetCredentialCancellationException) {
        GoogleAccount.Cancelled
    } catch (_: GetCredentialException) {
        GoogleAccount.Unavailable
    }
}
