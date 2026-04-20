"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cyclesController = void 0;
const cycles_service_1 = require("./cycles.service");
exports.cyclesController = {
    async list(_req, res, next) {
        try {
            res.json(await cycles_service_1.cyclesService.list());
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const result = await cycles_service_1.cyclesService.create(req.body, req.user.id);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const result = await cycles_service_1.cyclesService.update(req.params.id, req.body, req.user.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async handover(req, res, next) {
        try {
            const result = await cycles_service_1.cyclesService.handover(req.params.id, req.body, req.user.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
};
