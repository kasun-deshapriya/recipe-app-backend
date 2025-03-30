import express from "express";
import UserRouter from "./routes/user-router.js";
import { pool } from "./db/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cookieParser());

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = 5000;

app.use("/api/v1/", UserRouter);

try {
  await pool.connect();
  console.log("Connected to the database.");
  // Start Server
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
} catch (error) {
  console.log("Error connecting to the database.", error);
}
