import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "../../utils/errors";

const uploadsDir = path.resolve(process.cwd(), "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const safeBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    callback(null, `${safeBaseName || "device-photo"}-${uniqueSuffix}${extension}`);
  }
});

function fileFilter(_req: Express.Request, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith("image/")) {
    callback(new AppError(400, "Можно загружать только изображения"));
    return;
  }

  callback(null, true);
}

export const uploadDevicePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
