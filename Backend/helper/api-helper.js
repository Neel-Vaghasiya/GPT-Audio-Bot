
import { getAllAudioBase64 } from 'google-tts-api';
import { openai } from '../routes/process-query.js';
import { createReadStream } from "fs";

export const getTextResponse = async (query)=>{
    return openai.createCompletion({
        model: "text-davinci-003",
        prompt: query,
        temperature: 0,
        max_tokens: 200
    });
}

export const convertIntoAudio = async (speech)=>{
    return getAllAudioBase64(speech, {
        lang: 'hi',
        slow: false,
        host: 'https://translate.google.com',
    });
}

export const convertIntoText = async (audioQueryPath) => {
    const stream = createReadStream(audioQueryPath);
    return openai.createTranscription(
        stream,
        "whisper-1",
        0
    );
}