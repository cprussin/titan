package net.prussin.titan.core.wire

import kotlinx.serialization.json.Json

/**
 * The one JSON configuration for the wire and for local files. Unknown keys are
 * ignored because v1 shapes only ever grow optional fields (DATA.md); absent
 * optionals are omitted on the way out, as the server's Zod schemas expect.
 */
val WireJson: Json =
    Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }
