package net.prussin.titan.core.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

data class HttpRequest(
    val method: String,
    val path: String,
    val body: String? = null,
)

data class HttpResponse(
    val code: Int,
    val body: String,
)

/** The one seam between the app and the network, so everything above it is testable. */
fun interface HttpTransport {
    /** Throws [IOException] when the server can't be reached. */
    suspend fun execute(request: HttpRequest): HttpResponse
}

/** Where to reach the server and who is asking. */
interface Credentials {
    val baseUrl: String
    val token: String?
    val timeZone: String
}

class OkHttpTransport(
    private val credentials: Credentials,
    private val client: OkHttpClient =
        OkHttpClient
            .Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build(),
) : HttpTransport {
    override suspend fun execute(request: HttpRequest): HttpResponse =
        withContext(Dispatchers.IO) {
            val builder =
                Request
                    .Builder()
                    .url(credentials.baseUrl.trimEnd('/') + request.path)
                    .header("Cookie", "tz=${credentials.timeZone}")
                    .method(request.method, request.body?.toRequestBody(JSON))
            credentials.token?.let { builder.header("Authorization", "Bearer $it") }
            client.newCall(builder.build()).execute().use { response ->
                HttpResponse(response.code, response.body.string())
            }
        }

    private companion object {
        val JSON = "application/json".toMediaType()
    }
}
