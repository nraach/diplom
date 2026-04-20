"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devicesController = void 0;
const errors_1 = require("../../utils/errors");
const devices_service_1 = require("./devices.service");
exports.devicesController = {
    async list(_req, res, next) {
        try {
            res.json(await devices_service_1.devicesService.list());
        }
        catch (error) {
            next(error);
        }
    },
    async get(req, res, next) {
        try {
            res.json(await devices_service_1.devicesService.get(req.params.id));
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const result = await devices_service_1.devicesService.create(req.body, req.user.id);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    uploadPhoto(req, res, next) {
        try {
            const file = req.file;
            if (!file) {
                throw new errors_1.AppError(400, "Файл не был загружен");
            }
            res.status(201).json({
                photoUrl: `/uploads/${file.filename}`
            });
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const result = await devices_service_1.devicesService.update(req.params.id, req.body, req.user.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
};
