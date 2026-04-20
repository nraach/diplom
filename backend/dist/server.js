"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const app_1 = require("./app");
app_1.app.listen(env_1.env.PORT, () => {
    console.log(`Backend API listening on port ${env_1.env.PORT}`);
});
