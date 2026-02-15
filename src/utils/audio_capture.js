/**
 * Microphone audio capture utility for voice input.
 * Captures 16kHz mono PCM float32 audio via Web Audio API,
 * which is the format Parakeet ASR expects.
 */

/**
 * Check if a microphone input device is available
 * @returns {Promise<boolean>} Whether an audio input device exists
 */
export const check_microphone_available = async () => {

    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        return devices.some( d => d.kind === `audioinput` )
    } catch {
        return false
    }

}

/**
 * Start capturing microphone audio at 16kHz mono PCM float32.
 * Returns a handle with `stop()` to retrieve audio and `get_level()` for real-time amplitude.
 * @returns {Promise<{ stop: () => Float32Array, stream: MediaStream, get_level: () => number }>}
 */
export const start_audio_capture = async () => {

    // Request microphone access at 16kHz mono for Parakeet compatibility
    const stream = await navigator.mediaDevices.getUserMedia( {
        audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
        },
    } )

    // Create audio context at the required sample rate
    const audio_context = new AudioContext( { sampleRate: 16000 } )
    const source = audio_context.createMediaStreamSource( stream )

    // Analyser node for real-time audio level metering
    const analyser = audio_context.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.5
    const level_data = new Uint8Array( analyser.frequencyBinCount )

    // Collect PCM chunks via ScriptProcessorNode (widely supported but deprecated).
    // Future migration: replace with AudioWorkletNode + a separate worklet module.
    const buffer_size = 4096
    const processor = audio_context.createScriptProcessor( buffer_size, 1, 1 )
    const chunks = []

    processor.onaudioprocess = ( e ) => {
        const input_data = e.inputBuffer.getChannelData( 0 )
        // Copy the buffer since it gets reused
        chunks.push( new Float32Array( input_data ) )
    }

    // Route: source → analyser → processor → destination
    source.connect( analyser )
    analyser.connect( processor )
    processor.connect( audio_context.destination )

    /**
     * Get the current audio input level as a 0–1 normalised value.
     * Poll this via requestAnimationFrame for smooth metering.
     * @returns {number} Normalised audio level (0 = silence, 1 = max)
     */
    const get_level = () => {

        analyser.getByteTimeDomainData( level_data )

        // Compute RMS (root mean square) for a perceptually accurate level
        let sum_squares = 0
        for( let i = 0; i < level_data.length; i++ ) {
            const normalised = ( level_data[ i ] - 128 ) / 128
            sum_squares += normalised * normalised
        }
        const rms = Math.sqrt( sum_squares / level_data.length )

        // Scale to 0–1 range with some headroom (rms rarely exceeds ~0.5)
        return Math.min( 1, rms * 3 )

    }

    // Return control handle to stop and retrieve audio
    const stop = () => {

        // Disconnect and clean up audio nodes
        processor.disconnect()
        analyser.disconnect()
        source.disconnect()
        audio_context.close()

        // Stop all media tracks to release the microphone
        stream.getTracks().forEach( track => track.stop() )

        // Concatenate all chunks into a single Float32Array
        const total_length = chunks.reduce( ( sum, chunk ) => sum + chunk.length, 0 )
        const pcm = new Float32Array( total_length )
        let offset = 0
        for( const chunk of chunks ) {
            pcm.set( chunk, offset )
            offset += chunk.length
        }

        return pcm
    }

    return { stop, stream, get_level }

}
