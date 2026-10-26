package net.prussin.titan.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import net.prussin.titan.core.api.Credentials
import net.prussin.titan.core.reminder.ReminderSettings
import net.prussin.titan.core.wire.WireJson
import net.prussin.titan.ui.theme.ThemeMode
import java.time.ZoneId

/** Who is signed in where, plus the device-local preferences. */
class SessionStore(
    context: Context,
) : Credentials {
    private val prefs = context.getSharedPreferences("titan", Context.MODE_PRIVATE)

    private val _signedIn = MutableStateFlow(prefs.getString(TOKEN, null) != null)
    val signedIn: StateFlow<Boolean> = _signedIn.asStateFlow()

    private val _theme = MutableStateFlow(readTheme())
    val theme: StateFlow<ThemeMode> = _theme.asStateFlow()

    private val _reminder = MutableStateFlow(readReminder())
    val reminder: StateFlow<ReminderSettings> = _reminder.asStateFlow()

    override val baseUrl: String get() = prefs.getString(BASE_URL, null) ?: DEFAULT_BASE_URL
    override val token: String? get() = prefs.getString(TOKEN, null)
    override val timeZone: String get() = ZoneId.systemDefault().id

    val email: String? get() = prefs.getString(EMAIL, null)

    /** The local date of the latest weigh-in this phone knows about. */
    var lastWeighIn: String?
        get() = prefs.getString(LAST_WEIGH_IN, null)
        set(value) = prefs.edit().putString(LAST_WEIGH_IN, value).apply()

    var pendingVerifier: String?
        get() = prefs.getString(VERIFIER, null)
        set(value) = prefs.edit().putString(VERIFIER, value).apply()

    fun setBaseUrl(url: String) {
        prefs.edit().putString(BASE_URL, url.trim().trimEnd('/')).apply()
    }

    fun signIn(
        token: String,
        email: String,
    ) {
        prefs
            .edit()
            .putString(TOKEN, token)
            .putString(EMAIL, email)
            .remove(VERIFIER)
            .apply()
        _signedIn.value = true
    }

    fun signOut() {
        prefs
            .edit()
            .remove(TOKEN)
            .remove(EMAIL)
            .remove(LAST_WEIGH_IN)
            .apply()
        _signedIn.value = false
    }

    fun setTheme(mode: ThemeMode) {
        prefs.edit().putString(THEME, mode.name).apply()
        _theme.value = mode
    }

    fun setReminder(settings: ReminderSettings) {
        prefs.edit().putString(REMINDER, WireJson.encodeToString(ReminderSettings.serializer(), settings)).apply()
        _reminder.value = settings
    }

    private fun readTheme(): ThemeMode =
        prefs.getString(THEME, null)?.let { name -> ThemeMode.entries.firstOrNull { it.name == name } }
            ?: ThemeMode.SYSTEM

    private fun readReminder(): ReminderSettings =
        prefs.getString(REMINDER, null)?.let {
            runCatching { WireJson.decodeFromString(ReminderSettings.serializer(), it) }.getOrNull()
        } ?: ReminderSettings()

    companion object {
        const val DEFAULT_BASE_URL = "https://titan.prussin.net"
        private const val BASE_URL = "baseUrl"
        private const val TOKEN = "token"
        private const val EMAIL = "email"
        private const val VERIFIER = "pendingVerifier"
        private const val THEME = "theme"
        private const val REMINDER = "reminder"
        private const val LAST_WEIGH_IN = "lastWeighIn"
    }
}
