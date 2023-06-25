import express, { json } from 'express';
import cors from 'cors';
import { router } from './routes/process-query.js';
import { config } from 'dotenv';

config();
// Express app initialization
const app = express();

// For using environment variable

app.use(cors());
app.use(json());

// Route
app.use('/api/process-query', router);

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});