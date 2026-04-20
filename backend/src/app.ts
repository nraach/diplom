import cors from "cors";
import express from "express";
import path from "path";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { auditRoutes } from "./modules/audit/audit.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { cyclesRoutes } from "./modules/cycles/cycles.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { devicesRoutes } from "./modules/devices/devices.routes";
import { usersRoutes } from "./modules/users/users.routes";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed"));
    }
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/devices", devicesRoutes);
app.use("/cycles", cyclesRoutes);
app.use("/audit", auditRoutes);
app.use("/dashboard", dashboardRoutes);

app.use(errorMiddleware);
