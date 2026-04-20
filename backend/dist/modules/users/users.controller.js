"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const users_service_1 = require("./users.service");
exports.usersController = {
    async list(_req, res, next) {
        try {
            res.json(await users_service_1.usersService.list());
        }
        catch (error) {
            next(error);
        }
    },
    async approve(req, res, next) {
        try {
            const result = await users_service_1.usersService.approve(req.params.id, req.user.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async block(req, res, next) {
        try {
            const result = await users_service_1.usersService.block(req.params.id, req.user.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    },
    async changeRole(req, res, next) {
        try {
            const result = await users_service_1.usersService.changeRole(req.params.id, req.body.role, req.user.id);
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
};
