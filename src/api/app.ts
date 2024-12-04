import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { uploadRouter } from './routes/upload';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const app: Application = express();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });  // Create the uploads directory if it doesn't exist
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/api', uploadRouter);

export default app;