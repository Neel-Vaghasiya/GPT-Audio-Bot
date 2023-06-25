# GPT Audio Bot

GPT Audio Bot formally mentioned as AI Mentor is an intelligent chatbot with audio transcription and text-to-speech capabilities. It utilizes the power of OpenAI's GPT-3 to provide conversational assistance and handle various tasks such as speech-to-text transcription and text generation.

## Features

- Audio Transcription: Convert Speech to text directly on the browser if browser supports SpeechRecongtion API
- Audio Transcription: Convert uploaded audio files to text using OpenAI Whisper API if browser don't support SpeechRecognition API.
- Conversational Chatbot: Interact with the chatbot using natural language queries and receive text-based responses.
- Text-to-Speech Conversion: Convert text responses into audio using the Google Text-to-Speech API.

## API Endpoints

### Generate Transcription from Audio

**Endpoint:** `POST /api/generate-transcribe`

**Request:**
- Content-Type: multipart/form-data
- Parameters:
  - audioFile: <audio/webm file>

**Response:**
- Status: 200 OK
- Content-Type: application/json
- Body:
{
"transcript": "<transcription text>"
}
This endpoint accepts a multipart form-data request with an audio file and returns the transcribed text as a JSON response.

### Get Chatbot Response

**Endpoint:** `POST /api`

**Request:**
- Content-Type: application/json
- Body:
{
"transcript": "<user query>"
}

**Response:**
- Status: 200 OK
- Content-Type: audio/wav
- Body: `<audio data>`

This endpoint accepts a JSON request with a user query and returns a chatbot response as audio in WAV format.

### Receive Response for Transcription

**Endpoint:** `GET /api/receive-response`

**Response:**
- Status: 200 OK
- Content-Type: audio/wav
- Body: `<audio data>`

This endpoint is used to receive the audio response for the transcription request.

## Setup and Configuration

To set up GPT Audio Bot or AI Mentor, follow these steps:

1. Clone the repository: `git clone https://github.com/Neel-Vaghasiya/GPT-Audio-Bot.git`
2. Change Directory to Backend: 'cd Backend'
3. Install dependencies: `npm install`
4. Configure the API credentials: Provide the necessary API keys and settings in the configuration file.
5. Start the server: `npm start`
6. Access the application at `http://localhost:3000` (or the specified URL).

## Demo

You can find a live demo of GPT Audio Bot or AI Mentor [here](https://aimentor.netlify.app/).

## Contribution

Contributions are welcome! If you find any issues or have suggestions for improvements, please submit a pull request or open an issue.
