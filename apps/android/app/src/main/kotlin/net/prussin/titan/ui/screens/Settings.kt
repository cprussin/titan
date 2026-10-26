package net.prussin.titan.ui.screens

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TimePickerDefaults
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import net.prussin.titan.R
import net.prussin.titan.core.wire.SettingsData
import net.prussin.titan.reminder.Reminders
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.components.ConfirmDialog
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.PageBody
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanCard
import net.prussin.titan.ui.components.TitanDialog
import net.prussin.titan.ui.components.ToggleGroup
import net.prussin.titan.ui.components.TopBar
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.components.pageWidth
import net.prussin.titan.ui.components.rememberResource
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.ThemeMode
import net.prussin.titan.ui.theme.Titan
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun SettingsScreen() {
    val graph = LocalGraph.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val resource = rememberResource("settings", SettingsData.serializer()) { settings() }
    val theme by graph.session.theme.collectAsState()
    val reminder by graph.session.reminder.collectAsState()
    var pickingTime by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf(false) }
    var syncing by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    val data = resource.value
    val wide = Modifier.pageWidth(720.dp)
    Column {
        TopBar("Settings", icon = R.drawable.ph_gear)
        PageBody(resource.status, true, maxWidth = 720.dp) {
            item {
                SettingRow(wide, "Account", "Signed in as ${data?.accountEmail ?: graph.session.email ?: "…"}.") {
                    TitanButton("Log out", {
                        graph.signOut()
                    }, variant = Variant.OUTLINE, size = ControlSize.SM, icon = R.drawable.ph_sign_out)
                }
            }
            item {
                TitanCard(wide, title = "Appearance") {
                    MutedText("Switch between light, dark, and system.")
                    ToggleGroup(
                        listOf(ThemeMode.LIGHT to "Light", ThemeMode.DARK to "Dark", ThemeMode.SYSTEM to "System"),
                        theme,
                        graph.session::setTheme,
                        Modifier.fillMaxWidth(),
                    )
                }
            }
            item {
                SettingRow(
                    wide,
                    "Weigh-in reminder",
                    if (reminder.enabled) {
                        "Every morning at ${reminder.time.format(TIME)}, unless you've already weighed in."
                    } else {
                        "Off."
                    },
                ) {
                    Switch(
                        checked = reminder.enabled,
                        onCheckedChange = {
                            graph.session.setReminder(reminder.copy(enabled = it))
                            Reminders.schedule(context)
                        },
                        colors = SwitchDefaults.colors(checkedTrackColor = Titan.colors.accent),
                    )
                }
                if (reminder.enabled) {
                    Row(wide) {
                        TitanButton(
                            "Change time",
                            { pickingTime = true },
                            variant = Variant.GHOST,
                            size = ControlSize.SM,
                        )
                    }
                }
            }
            item {
                if (data?.concept2Connected == true) {
                    SettingRow(wide, "Concept2 rowing", "${data.concept2WorkoutCount} imported workouts.") {
                        TitanButton(
                            "Sync Concept2",
                            {
                                syncing = true
                                scope.launch {
                                    message = online { graph.api.concept2Sync() }
                                    syncing = false
                                    graph.repository.invalidate()
                                }
                            },
                            variant = Variant.OUTLINE,
                            size = ControlSize.SM,
                            loading = syncing,
                            icon = R.drawable.ph_arrows_clockwise,
                        )
                    }
                } else {
                    SettingRow(
                        wide,
                        "Concept2 rowing",
                        "Connect your Concept2 Logbook to import rows and heart-rate data.",
                    ) {
                        TitanButton(
                            "Connect Concept2",
                            {
                                CustomTabsIntent.Builder().build().launchUrl(
                                    context,
                                    Uri.parse("${graph.session.baseUrl}/settings"),
                                )
                            },
                            variant = Variant.OUTLINE,
                            size = ControlSize.SM,
                        )
                    }
                }
            }
            item {
                SettingRow(wide, "Server", graph.session.baseUrl.removePrefix("https://")) {}
            }
            item {
                SettingRow(wide, "Delete history", "Permanently delete all logged workouts and weigh-ins.") {
                    TitanButton("Delete history", { deleting = true }, variant = Variant.DANGER, size = ControlSize.SM)
                }
            }
            message?.let { item { Text(it, wide, color = Titan.colors.danger) } }
        }
    }
    if (pickingTime) {
        TimeDialog(reminder.time, onDismiss = { pickingTime = false }) { time ->
            graph.session.setReminder(reminder.copy(hour = time.hour, minute = time.minute))
            Reminders.schedule(context)
        }
    }
    if (deleting) {
        ConfirmDialog(
            title = "Delete all history?",
            text = "This permanently deletes every logged workout and weigh-in. It can’t be undone.",
            cancelLabel = "Keep history",
            confirmLabel = "Delete history",
            onDismiss = { deleting = false },
            onConfirm = {
                scope.launch {
                    message = online { graph.api.deleteHistory() }
                    graph.session.lastWeighIn = null
                    graph.repository.invalidate()
                }
            },
        )
    }
}

private val TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.US)

@Composable
private fun SettingRow(
    modifier: Modifier,
    title: String,
    description: String,
    action: @Composable () -> Unit,
) {
    TitanCard(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = Titan.body(TextSize.sm, FontWeight.SemiBold), color = Titan.colors.foreground)
                MutedText(description)
            }
            action()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimeDialog(
    initial: LocalTime,
    onDismiss: () -> Unit,
    onPick: (LocalTime) -> Unit,
) {
    val state = rememberTimePickerState(initial.hour, initial.minute, is24Hour = false)
    val c = Titan.colors
    TitanDialog(
        title = "Reminder time",
        onDismiss = onDismiss,
        actions = {
            TitanButton("Cancel", onDismiss, variant = Variant.GHOST)
            TitanButton("Save", {
                onPick(LocalTime.of(state.hour, state.minute))
                onDismiss()
            }, variant = Variant.ACCENT)
        },
    ) {
        TimePicker(
            state,
            colors =
                TimePickerDefaults.colors(
                    clockDialColor = c.card,
                    selectorColor = c.accent,
                    timeSelectorSelectedContainerColor = c.alpha(c.accent, 0.2),
                    periodSelectorSelectedContainerColor = c.alpha(c.accent, 0.2),
                ),
        )
    }
}
