import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

const uploadRouter = express.Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage
});

// File upload route
uploadRouter.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
      res.status(400).json({
          message: 'No file uploaded'
      });
      return;
  }

  res.status(200).json({
      message: 'File uploaded successfully',
      file: req.file,
  });
});

export {
  uploadRouter
};