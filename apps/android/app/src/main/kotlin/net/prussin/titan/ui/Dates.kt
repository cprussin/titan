package net.prussin.titan.ui

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val calendar = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US)

/** "Oct 26, 2026" (`formatCalendarDate`). */
fun formatCalendarDate(iso: String): String = runCatching { LocalDate.parse(iso).format(calendar) }.getOrDefault(iso)

fun today(): String = LocalDate.now().toString()
