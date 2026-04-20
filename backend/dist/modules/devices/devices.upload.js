"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDevicePhoto = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("../../utils/errors");
const uploadsDir = path_1.default.resolve(process.cwd(), "uploads");
fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadsDir);
    },
    filename: (_req, file, callback) => {
        const extension = path_1.default.extname(file.originalname) || ".jpg";
        const safeBaseName = path_1.default
            .basename(file.originalname, path_1.default.extname(file.originalname))
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 50);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        callback(null, `${safeBaseName || "device-photo"}-${uniqueSuffix}${extension}`);
    }
});
function fileFilter(_req, file, callback) {
    if (!file.mimetype.startsWith("image/")) {
        callback(new errors_1.AppError(400, "Можно загружать только изображения"));
        return;
    }
    callback(null, true);
}
exports.uploadDevicePhoto = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
