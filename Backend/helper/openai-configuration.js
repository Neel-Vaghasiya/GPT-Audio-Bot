import { config } from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

config();

export const configOpenai = ()=>{
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_SECRET_API_KEY,
    });
    
    return new OpenAIApi(configuration);
}

