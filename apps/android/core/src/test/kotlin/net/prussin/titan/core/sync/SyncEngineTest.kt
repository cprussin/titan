package net.prussin.titan.core.sync

import kotlinx.coroutines.test.runTest
import net.prussin.titan.core.api.HttpRequest
import net.prussin.titan.core.api.HttpResponse
import net.prussin.titan.core.api.HttpTransport
import net.prussin.titan.core.api.ProgressBody
import net.prussin.titan.core.api.TitanApi
import net.prussin.titan.core.api.WeighInBody
import net.prussin.titan.core.store.JsonStore
import net.prussin.titan.core.wire.InProgressExercise
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.io.File
import java.io.IOException

class SyncEngineTest {
    @TempDir
    lateinit var dir: File

    /** Answers each request from [respond], recording what was sent. */
    private class FakeServer(
        val respond: (HttpRequest) -> HttpResponse,
    ) : HttpTransport {
        val sent = mutableListOf<HttpRequest>()

        override suspend fun execute(request: HttpRequest): HttpResponse {
            sent += request
            return respond(request)
        }
    }

    private fun outbox() = Outbox(JsonStore(File(dir, "outbox.json"), Outbox.serializer))

    private val start = OutboxOp.Start("phone-id", "2026-10-26T13:00:00Z", "2026-10-26")
    private val sets = OutboxOp.Progress("phone-id", ProgressBody.Sets(InProgressExercise("s", emptyList())))
    private val weighIn = OutboxOp.WeighIn(WeighInBody("w", "2026-10-26", 210.0))

    @Test
    fun `replays in order and adopts the server's session id`() =
        runTest {
            val server =
                FakeServer {
                    if (it.method == "POST" && it.path == "/api/v1/workouts") {
                        HttpResponse(200, """{"id":"server-id"}""")
                    } else {
                        HttpResponse(200, """{"ok":true}""")
                    }
                }
            val queue = outbox().apply { append(listOf(start, sets, weighIn)) }
            val report = SyncEngine(TitanApi(server), queue).drain()
            assertTrue(report.drained)
            assertEquals(mapOf("phone-id" to "server-id"), report.adopted)
            assertEquals(
                listOf("/api/v1/workouts", "/api/v1/workouts/server-id", "/api/v1/body-metrics"),
                server.sent.map { it.path },
            )
            assertTrue(server.sent[1].body!!.contains("\"kind\":\"sets\""))
            assertEquals(emptyList<OutboxOp>(), queue.all())
        }

    @Test
    fun `keeps everything queued while the server is unreachable`() =
        runTest {
            val queue = outbox().apply { append(listOf(start, weighIn)) }
            val report = SyncEngine(TitanApi(FakeServer { throw IOException("offline") }), queue).drain()
            assertFalse(report.drained)
            assertEquals(listOf(start, weighIn), queue.all())
        }

    @Test
    fun `drops a closed session's ops and carries on`() =
        runTest {
            val server =
                FakeServer {
                    if (it.path.startsWith("/api/v1/workouts/")) HttpResponse(409, "{}") else HttpResponse(200, "{}")
                }
            val queue = outbox().apply { append(listOf(sets, sets.copy(), weighIn)) }
            val report = SyncEngine(TitanApi(server), queue).drain()
            assertEquals(setOf("phone-id"), report.conflicts)
            assertTrue(report.drained)
            assertEquals(2, server.sent.size)
        }

    @Test
    fun `stops for sign-in on a refused token`() =
        runTest {
            val queue = outbox().apply { append(listOf(weighIn)) }
            val report = SyncEngine(TitanApi(FakeServer { HttpResponse(401, "{}") }), queue).drain()
            assertTrue(report.unauthorized)
            assertEquals(listOf<OutboxOp>(weighIn), queue.all())
        }
}
