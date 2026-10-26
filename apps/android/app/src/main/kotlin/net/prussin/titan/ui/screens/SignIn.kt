package net.prussin.titan.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import net.prussin.titan.R
import net.prussin.titan.ui.LocalGraph
import net.prussin.titan.ui.components.ControlSize
import net.prussin.titan.ui.components.MutedText
import net.prussin.titan.ui.components.TitanButton
import net.prussin.titan.ui.components.TitanMark
import net.prussin.titan.ui.components.TitanTextField
import net.prussin.titan.ui.components.Variant
import net.prussin.titan.ui.theme.TextSize
import net.prussin.titan.ui.theme.Titan

/** The sign-in panel (`SignInPanel`), with the server it signs in to. */
@Composable
fun SignInScreen(
    error: String?,
    busy: Boolean,
    onSignIn: (String) -> Unit,
) {
    val session = LocalGraph.current.session
    var server by rememberSaveable { mutableStateOf(session.baseUrl) }
    var editing by rememberSaveable { mutableStateOf(false) }
    val c = Titan.colors
    Box(Modifier.fillMaxSize().background(c.background).safeDrawingPadding(), contentAlignment = Alignment.Center) {
        Column(
            Modifier.widthIn(max = 380.dp).fillMaxWidth().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            TitanMark(72.dp)
            Text(
                "TITAN",
                style = Titan.condensed(TextSize.x5l).copy(letterSpacing = TextSize.x5l * 0.06),
                color = c.foreground,
            )
            MutedText("Sign in to your training.", size = TextSize.md)
            TitanButton(
                "Sign in with Google",
                { onSignIn(server) },
                Modifier.fillMaxWidth(),
                variant = Variant.ACCENT,
                size = ControlSize.XL,
                loading = busy,
                icon = R.drawable.ph_google_logo_bold,
            )
            error?.let { Text(it, style = Titan.body(TextSize.sm), color = c.danger) }
            if (editing) {
                TitanTextField(server, { server = it }, "Server", keyboard = KeyboardType.Uri)
            } else {
                TitanButton("Server: ${server.removePrefix("https://")}", {
                    editing = true
                }, variant = Variant.GHOST, size = ControlSize.SM)
            }
        }
    }
}
