import multer, { memoryStorage } from 'multer';

const storage = memoryStorage();
export const audioConverter = multer({ storage: storage }).single('audioData');
