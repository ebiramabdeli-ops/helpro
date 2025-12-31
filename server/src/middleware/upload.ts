import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directories exist
const uploadDirs = {
  identity: path.join(process.cwd(), 'uploads', 'identity'),
  biometric: path.join(process.cwd(), 'uploads', 'biometric'),
  avatar: path.join(process.cwd(), 'uploads', 'avatar'),
  temp: path.join(process.cwd(), 'uploads', 'temp'),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const purpose = (req.body.purpose || 'temp') as keyof typeof uploadDirs;
    const dir = uploadDirs[purpose] || uploadDirs.temp;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload configurations for different purposes
export const uploadConfigs = {
  single: upload.single('file'),
  identity: upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
  ]),
  biometric: upload.single('faceImage'),
  avatar: upload.single('avatar'),
  multiple: upload.array('files', 5),
};
