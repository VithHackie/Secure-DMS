import express from 'express'
import { sequelise, connectDB } from './db/dbconnection.js';
import "dotenv/config"
import cors from 'cors'
import {User} from "./models/UserModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';


const app = express();

connectDB();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      badgeNumber: user.badge_number 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Token expires in 24 hours
  );
};

app.post("/signup", async (req, res)=>{
  try {
    const { fullName, email, password, role, badgeNumber, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to Postgres via Sequelize
    const newUser = await User.create({
      full_name: fullName,
      email,
      password_hash: hashedPassword,
      role: role || 'investigating_officer',
      badge_number: badgeNumber,
      department
    });

    // Generate JWT
    const token = generateToken(newUser);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Validate password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  else console.log("SERVER IS RUNNING ON PORT ", process.env.PORT);
});
