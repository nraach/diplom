import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "../../utils/errors";

const uploadsDir = path.resolve(process.cwd(), "uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype] ?? ".bin";
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
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new AppError(400, "Можно загружать только JPG, PNG или WEBP изображения"));
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

export async function validateUploadedImage(file: Express.Multer.File) {
  const detectedMimeType = detectImageMimeType(await fs.promises.readFile(file.path));

  if (!detectedMimeType || detectedMimeType !== file.mimetype) {
    await fs.promises.unlink(file.path).catch(() => undefined);
    throw new AppError(400, "Файл не прошел проверку безопасности изображения");
  }
}

function detectImageMimeType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
