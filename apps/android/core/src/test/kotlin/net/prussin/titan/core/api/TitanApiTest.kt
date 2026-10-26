package net.prussin.titan.core.api

import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TitanApiTest {
    private val requests = mutableListOf<HttpRequest>()

    private fun api(body: String) =
        TitanApi { request ->
            requests += request
            HttpResponse(200, body)
        }

    @Test
    fun `reads the Google client in-app sign-in asks for`() =
        runTest {
            val config = api("""{"googleClientId":"web-client"}""").appConfig()
            assertEquals("web-client", config.googleClientId)
            assertEquals(HttpRequest("GET", "/api/v1/auth/app/config", null), requests.single())
        }

    @Test
    fun `trades a Google ID token for a session`() =
        runTest {
            val response =
                api("""{"token":"t","user":{"email":"a@b.c","name":"A"}}""")
                    .signInWithGoogle("id-token")
            assertEquals("t", response.token)
            assertEquals(
                HttpRequest("POST", "/api/v1/auth/app/google", """{"idToken":"id-token"}"""),
                requests.single(),
            )
        }
}
