import { Router } from 'express';
import { audioConverter } from '../middleware/audio-conversion.js';
import { writeFileSync } from "fs";
import { getTextResponse, convertIntoAudio, convertIntoText } from '../helper/api-helper.js'
import { configOpenai } from '../helper/openai-configuration.js';

export const router = Router();
export const openai = configOpenai();

let query = "";

router.post('/generate-transcribe', audioConverter, async (req, res) => {
    try {
        // Save uploaded audio data to a temporary file
        const audioData = req.file.buffer;
        const audioQueryPath = './audio_query.wav';

        writeFileSync(audioQueryPath, audioData);

        // Transcribe audio using OpenAI Whisper API
        const transcriptionResponse = await convertIntoText(audioQueryPath); 

        // Send Transcripted text as JSON response
        query = transcriptionResponse.data.text;
        
        if(query==='')
            res.status(400).json({error: 'No input received'});
        else
            res.status(200).json({ transcript: query });

    }
    catch (error) {
        if(error.response && error.response.status===429)
            res.status(error.response.status).json({ error: 'Limit Reached' });
        else 
            res.status(500).json({error: "Failed to Convert Speech to Text"});
        console.log(error);
    }
});


router.get('/receive-response', async (req, res) => {
    try {
        if(query!=='') {
            const chatResponse = await getTextResponse(query);
            let speech = chatResponse.data.choices[0].text.trim();

            const audioBase64s = await convertIntoAudio(speech);

            res.writeHead(200, {
                'Content-Type': 'audio/wav',
            });

            // Concatenate the audio chunks into a single audio file
            const concatenatedAudio = audioBase64s.map(audio => Buffer.from(audio.base64, 'base64'));
            const mergedAudio = Buffer.concat(concatenatedAudio);

            res.write(mergedAudio);
            res.end();
        }
        else {
            res.status(400).json({error: "No input received"});
        }
    }
    catch(error) {
        if(error.response && error.response.status===429)
            res.status(error.response.status).json({ error: 'Limit Reached' });
        else 
            res.status(500).json({error: "Failed to process query"});
        console.log(error);
    }
});

router.post('/', async (req, res) => {
    try {
        query = req.body.transcript;
        if(query!=='') {
            const chatResponse = await getTextResponse(query);

            let speech = chatResponse.data.choices[0].text.trim();

            const audioBase64s = await convertIntoAudio(speech);

            res.writeHead(200, {
                'Content-Type': 'audio/wav',
            });

            // Concatenate the audio chunks into a single audio file
            const concatenatedAudio = audioBase64s.map(audio => Buffer.from(audio.base64, 'base64'));
            const mergedAudio = Buffer.concat(concatenatedAudio);

            res.write(mergedAudio);

            res.end();
        }
        else {
            res.status(400).json({error: "No input received"});
        }
    }
    catch(error) {
        if(error.response && error.response.status===429)
            res.status(error.response.status).json({ error: 'Limit Reached' });
        else 
            res.status(500).json({error: "Failed to process query"});
        console.log(error);
    }
})
