import express from "express";
import { pool } from "../db/db.js";
import jwt from "jsonwebtoken";


const UserRouter = express.Router();
const JWT_SECRET = "jwt_secret_login";

UserRouter.get("/", (req, res) => {
  res.send("Node.js App is running!");
});

UserRouter.post("/singup-user", async (req, res) => {
  const { email, first_name, last_name, mobile, password } = req.body;
  console.log("req.body", req.body);

  try {
    const result = await pool.query(
      `INSERT INTO user_registration (first_name, last_name, email, mobile, password) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [first_name, last_name, email, mobile, password]
    );

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const token = jwt.sign({ userId: result.rows[0].id, email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("Generated Token:", token);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


UserRouter.post("/login-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userQuery = await pool.query(
      "SELECT * FROM user_registration WHERE email = $1 LIMIT 1",
      [email]
    );
    const user = userQuery.rows[0];

    // If user exists, verify password
    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

UserRouter.post("/add-to-favourite", async (req, res) => {
  const { id, name } = req.body;
  console.log("req.body", req.body);
  const token = req.cookies.token;
  let userId;

  if (token) {
    try {
      const decodedToken = jwt.verify(token, JWT_SECRET);
      console.log("Decoded Token:", decodedToken);
      userId = decodedToken.userId;
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res
        .status(401)
        .json({ success: false, msg: "Invalid or expired token." });
    }
  } else {
    return res.status(401).json({ success: false, msg: "No token provided." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO favourite_item (name, item_id, user_id) 
       VALUES ($1, $2, $3) RETURNING id`,
      [name, id, userId]
    );

    res.status(201).json({
      message: "Added successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Error inserting:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

UserRouter.get("/favourites", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const result = await pool.query(
      "SELECT * FROM favourite_item WHERE user_id = $1",
      [userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving favourites:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

UserRouter.post("/logout-user", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});



export default UserRouter;
