package net.prussin.titan.core.auth

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class PkceTest {
    @Test
    fun `derives the S256 challenge the server checks`() {
        // Node's `createHash("sha256").update(v).digest("base64url")`, as `codeChallenge` computes it.
        assertEquals("6DJ9MiDigWK0uTOi2GZyoCpq-OEpLM65CZ8wmzMv2oU", Pkce.challengeFor("titan-verifier"))
        val pkce = Pkce.create()
        assertTrue(pkce.challenge.length >= 43)
        assertEquals(pkce.challenge, Pkce.challengeFor(pkce.verifier))
    }

    @Test
    fun `reads the handoff from the deep link`() {
        assertEquals("a.b", handoffFrom("titan://auth?token=a.b"))
        assertNull(handoffFrom("titan://auth"))
        assertNull(handoffFrom("https://example.com/?token=x"))
    }
}
