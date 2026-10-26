package net.prussin.titan.workout

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import net.prussin.titan.core.workout.Cue
import kotlin.math.PI
import kotlin.math.sin

/**
 * The web's `rest-alarm.ts` tones, synthesized: a short 660 Hz blip for each of
 * the last ten seconds, and an 880 → 1318.5 Hz chime repeating every 1.2 s
 * until stopped. Plays on the alarm stream so it sounds with the screen off.
 */
class ToneSynth(
    private val scope: CoroutineScope,
) {
    private val tick = track(note(660.0, 0.06, 0.2))
    private val chime = track(note(880.0, NOTE_SEC, 0.4) + note(1318.51, NOTE_SEC, 0.4))
    private var chiming: Job? = null

    fun play(cue: Cue) {
        when (cue) {
            Cue.TICK -> {
                replay(tick)
            }

            Cue.CHIME_START -> {
                chiming?.cancel()
                chiming =
                    scope.launch {
                        while (isActive) {
                            replay(chime)
                            delay(CHIME_EVERY_MS)
                        }
                    }
            }

            Cue.CHIME_STOP -> {
                stop()
            }
        }
    }

    fun stop() {
        chiming?.cancel()
        chiming = null
        runCatching { chime.stop() }
    }

    fun release() {
        stop()
        tick.release()
        chime.release()
    }

    private fun replay(track: AudioTrack) {
        runCatching {
            track.stop()
            track.reloadStaticData()
            track.play()
        }
    }

    private companion object {
        const val RATE = 44_100
        const val NOTE_SEC = 0.18
        const val CHIME_EVERY_MS = 1_200L

        /** A sine note: a linear attack over the first 15%, then an exponential fade. */
        fun note(
            frequency: Double,
            seconds: Double,
            gain: Double,
        ): ShortArray {
            val count = (RATE * seconds).toInt()
            val attack = (count * 0.15).toInt().coerceAtLeast(1)
            return ShortArray(count) { i ->
                val envelope =
                    if (i < attack) {
                        i.toDouble() / attack
                    } else {
                        Math.pow(0.001, (i - attack).toDouble() / (count - attack))
                    }
                (sin(2 * PI * frequency * i / RATE) * envelope * gain * Short.MAX_VALUE).toInt().toShort()
            }
        }

        fun track(samples: ShortArray): AudioTrack {
            val track =
                AudioTrack
                    .Builder()
                    .setAudioAttributes(
                        AudioAttributes
                            .Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build(),
                    ).setAudioFormat(
                        AudioFormat
                            .Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(RATE)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build(),
                    ).setTransferMode(AudioTrack.MODE_STATIC)
                    .setBufferSizeInBytes(samples.size * 2)
                    .build()
            track.write(samples, 0, samples.size)
            return track
        }
    }
}
