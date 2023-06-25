
const mic = document.querySelector('.mic');
const spokenText = document.getElementById('spokenText');
const audioPlayer = document.getElementById('audioPlayer');


// ---------------------- If SpeechRecognition is supported by browser --------------------------

let recognition;
let query = "";
let isRecognitionSupported = false;
let isPlaying = false;
let playbackBuffer = [];
let firefoxAgent = navigator.userAgent.indexOf("Firefox") > -1;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    let speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new speechRecognition();
    recognition.continuous = false; // Stop recognition on silence
    recognition.interimResults = true; // To fire result event on every word
    recognition.lang = 'en-US';


    if ('onstart' in recognition && 'onresult' in recognition && 'onend' in recognition && !firefoxAgent) {
        // isRecognitionSupported = true;
    }
}


// Event for every Spoken words
recognition.addEventListener('result', (event) => {
    query = event.results[0][0].transcript;
    spokenText.innerText = query;
});

// Ending of speech recognition
recognition.addEventListener('end', () => {
    mic.classList.remove('listening');

    sendTextToServer(query);
});


// On Microphone click
function startRecongnizing(event) {
    audioPlayer.src = '';
    isPlaying = false;
    playbackBuffer = [];
    query = '';

    if (isRecognitionSupported) {
        mic.classList.add('listening');
        recognition.start(); // Start the speech recognition
    }
    else {
        startRecording(event);
    }
}


// Send Converted text to server
async function sendTextToServer(query) {
    fetch('http://192.168.29.105:3000/api/process-query/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript: query })
    })
        .then(response => {
            // Create a ReadableStream from the response
            if (response.status === 200) {
                // Create a ReadableStream from the response
                const stream = response.body;

                // Create a new ReadableStreamReader
                const reader = stream.getReader();

                async function readAndPlay() {
                    reader.read().then(({ done, value }) => {

                        // Check if all audio chunks have been read
                        if (done) {
                            return;
                        }

                        // Convert the audio chunk to a Blob
                        const audioChunk = new Blob([value], { type: 'audio/webm' });

                        // Add the audio chunk to the buffer
                        playbackBuffer.push(audioChunk);

                        // Check if audio is currently playing
                        if (!isPlaying) {
                            // Start playing audio from the buffer
                            playFromBuffer();
                        }

                        readAndPlay();
                    });


                }

                // Start reading and playing audio chunks
                readAndPlay();
            }
            else {
                response.json()
                    .then(data => handleError(data.error));
            }

        })
        .catch(error => handleError('Error in processing'));
}



// -------------------------- If SpeechRecognition is not supported by browser -----------------------------

let mediaRecorder;
let audioChunks = [];
let formData;

function mediaRecorderEvents() {
    mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data); // Push Recorded Audio
        mediaRecorder.stop();
    });

    mediaRecorder.addEventListener('start', () => {
        mic.classList.add('listening');
        formData = new FormData();
        audioChunks = []; // Reset audio chunks
    });

    mediaRecorder.addEventListener('stop', () => {

        // Convert audio chunks to a single Blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        // Create FormData and append audio Blob
        formData.append('audioData', audioBlob, 'recording.webm');

        mic.classList.remove('listening');

        // Send audio data to the server
        sendAudioToServer();

        return;
    });
}

function startRecording(event) {
    mediaRecorder = null;
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorderEvents(); // Declaration of Event for mediaRecorder

            mediaRecorder.start(); // Start Recording

            // Allow silence for first 2 seconds
            setTimeout(() => {
                analyzeAudioForSilence(stream);
            }, 2000);

        })
        .catch(error => {
            mic.classList.remove('listening');
            handleError('error accessing microphone');
        });
}



async function sendAudioToServer() {
    fetch('http://192.168.29.105:3000/api/process-query/generate-transcribe', {
        method: 'POST',
        body: formData
    })
        .then(response =>
            response.json()
        )
        .then(data => {
            if (data.transcript) {
                spokenText.innerText = data.transcript;
                fetch('http://192.168.29.105:3000/api/process-query/receive-response', {
                    method: 'GET'
                })
                    .then(response => {

                        if (response.status === 200) {
                            // Create a ReadableStream from the response
                            const stream = response.body;

                            // Create a new ReadableStreamReader
                            const reader = stream.getReader();

                            async function readAndPlay() {
                                reader.read().then(({ done, value }) => {

                                    // Check if all audio chunks have been read
                                    if (done) {
                                        return;
                                    }

                                    // Convert the audio chunk to a Blob
                                    const audioChunk = new Blob([value], { type: 'audio/webm' });

                                    // Add the audio chunk to the buffer
                                    playbackBuffer.push(audioChunk);

                                    // Check if audio is currently playing
                                    if (!isPlaying) {
                                        // Start playing audio from the buffer
                                        playFromBuffer();
                                    }

                                    readAndPlay();
                                });


                            }

                            // Start reading and playing audio chunks
                            readAndPlay();
                        }
                        else {
                            response.json()
                                .then(data => handleError(data.error));
                        }
                    })
            }
            else {
                handleError(data.error);
            }
        })

        .catch(error => {
            mic.classList.remove('listening');
            handleError('Error processing audio');
        });

}


// --------------------------- Helpers ------------------------------


function playFromBuffer() {
    // Check if buffer is empty
    if (playbackBuffer.length === 0) {
        // No more chunks in the buffer, stop playing
        isPlaying = false;
        return;
    }

    // Get the next audio chunk from the buffer
    const audioChunk = playbackBuffer.shift();

    // Create a URL object from the audio Blob
    const audioUrl = URL.createObjectURL(audioChunk);

    // Set the audio source URL and play
    audioPlayer.src = audioUrl;
    audioPlayer.playbackRate = 1.15;

    // Start playing audio
    audioPlayer.play();
    isPlaying = true;

    // Listen for the 'ended' event to know when the audio has finished playing
    audioPlayer.addEventListener('ended', () => {
        // Continue playing from the buffer
        playFromBuffer();
    });
}

function analyzeAudioForSilence(stream) {
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    audioSource.connect(analyser);

    const bufferSize = analyser.fftSize;
    const bufferLength = bufferSize / 2;
    const dataBuffer = new Float32Array(bufferLength);

    let isSilenceDetected = false;
    let fianalSilence = false;
    let silenceTimeout;
    const silenceDuration = 500; // Silence time before declaring final Silence (in milliseconds)
    const silenceThreshold = 0.01;

    const checkSilence = () => {
        analyser.getFloatTimeDomainData(dataBuffer);

        // Calculate the root mean square (RMS) of the audio data
        let rms = 0;
        for (let i = 0; i < bufferLength; i++) {
            const sample = dataBuffer[i];
            rms += sample * sample;
        }
        rms = Math.sqrt(rms / bufferLength);

        if (!isSilenceDetected && rms < silenceThreshold) {

            isSilenceDetected = true; // Mark true and wait for silence to break

            // Start the silence timeout
            silenceTimeout = setTimeout(() => {
                fianalSilence = true; // Silence for predefined duration
                mediaRecorder.stop();
                return;
            }, silenceDuration);

        }
        else if (isSilenceDetected && rms >= silenceThreshold) {
            // Cancel the silence timeout if audio is detected again
            isSilenceDetected = false;
            clearTimeout(silenceTimeout);
        }

        if (fianalSilence) {
            return; // Stop checking for silence
        }

        // Schedule the next check
        requestAnimationFrame(checkSilence);
    };

    // Start analyzing audio for silence
    checkSilence();
}


function handleError(errorMsg) {
    mic.classList.remove('listening');
    const toast = document.getElementById('liveToast');
    const toastBody = document.getElementsByClassName('toast-body')[0];
    toastBody.textContent = errorMsg;
    toast.classList.add('show');
}