package net.prussin.titan.core.auth

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

/**
 * The PKCE pair binding a browser sign-in to this app: the challenge rides the
 * Google flow as its nonce, and only the holder of the verifier can redeem the
 * handoff the callback deep-links back (`app-sign-in.ts`).
 */
data class Pkce(
    val verifier: String,
    val challenge: String,
) {
    companion object {
        private val encoder = Base64.getUrlEncoder().withoutPadding()

        fun create(random: SecureRandom = SecureRandom()): Pkce {
            val bytes = ByteArray(32).also(random::nextBytes)
            val verifier = encoder.encodeToString(bytes)
            return Pkce(verifier, challengeFor(verifier))
        }

        fun challengeFor(verifier: String): String =
            encoder.encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII)))
    }
}

/** The `titan://auth?token=…` deep link's handoff token, if this is one. */
fun handoffFrom(uri: String): String? {
    val prefix = "titan://auth"
    return if (uri.startsWith(prefix)) {
        uri
            .substringAfter('?', "")
            .split('&')
            .map { it.split('=', limit = 2) }
            .firstOrNull { it[0] == "token" && it.size == 2 }
            ?.let { java.net.URLDecoder.decode(it[1], Charsets.UTF_8) }
    } else {
        null
    }
}
