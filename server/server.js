const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect("mongodb+srv://nandhini1542003:nandhini154@cluster0.srynasj.mongodb.net/notes-management?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("DB connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.error("DB connection failed:", err));

// Models
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: String,
  password: String,
}));

const Task = mongoose.model("Task", new mongoose.Schema({
  userId: String,
  title: String,
  deadline: String,
  completed: Boolean,
}));

// Mail Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nandhini1542003@gmail.com",
    pass: "uhme vacq fnbb tjgl", // Note: this is an App Password
  },
});

function sendReminder(to, taskTitle, deadline) {
  transporter.sendMail({
    from: "nandhini1542003@gmail.com",
    to,
    subject: " Task Reminder",
    text: `You added a task: "${taskTitle}" which is due on ${deadline}`,
  }, (err, info) => {
    if (err) console.log("Mail error", err);
    else console.log("Reminder sent:", info.response);
  });
}

// Middleware: Auth
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Token missing");
  try {
    req.user = jwt.verify(token, "secret");
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

// Routes

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).send("All fields required");
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).send("Email already exists");

  const hash = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hash });
  res.send("Registered successfully");
});

// Login
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.status(400).send("Invalid credentials");

  const token = jwt.sign({ id: user._id }, "secret");
  res.json({ token });
});

// Add Task
app.post("/tasks", auth, async (req, res) => {
  const { title, deadline } = req.body;
  if (!title || !deadline) return res.status(400).send("Title and deadline required");

  const today = new Date().setHours(0, 0, 0, 0);
  const taskDate = new Date(deadline).setHours(0, 0, 0, 0);
  if (taskDate < today) return res.status(400).send("Deadline cannot be in the past");

  const user = await User.findById(req.user.id);
  const task = await Task.create({ title, deadline, completed: false, userId: req.user.id });

  sendReminder(user.email, title, deadline);
  res.json(task);
});

// Get Tasks
app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });
  res.json(tasks);
});

// Update Task
app.put("/tasks/:id", auth, async (req, res) => {
  const { title, deadline } = req.body;
  if (!title || !deadline) return res.status(400).send("Title and deadline required");

  const today = new Date().setHours(0, 0, 0, 0);
  const taskDate = new Date(deadline).setHours(0, 0, 0, 0);
  if (taskDate < today) return res.status(400).send("Deadline cannot be in the past");

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true }
  );

  if (!task) return res.status(404).send("Task not found");
  res.json(task);
});

// Delete Task
app.delete("/tasks/:id", auth, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!task) return res.status(404).send("Task not found");
  res.send("Deleted successfully");
});
