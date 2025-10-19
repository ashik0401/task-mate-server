require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = new MongoClient(process.env.MONGO_URI);
let db, tasksCollection, usersCollection;

async function connectDB() {
  await client.connect();
  db = client.db("TaskMate");
  tasksCollection = db.collection("tasks");
  usersCollection = db.collection("users");
  console.log("MongoDB connected");
}
connectDB().catch(console.error);

async function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split(" ")[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


app.post("/tasks", verifyUser, async (req, res) => {
  try {
    const { title, description, priority, status, assignedUser, dueDate } = req.body;
    if (!title || !assignedUser) return res.status(400).json({ error: "Missing required fields" });
    const task = { title, description, priority, status, assignedUser, dueDate, createdBy: req.user.email, createdAt: new Date() };
    const result = await tasksCollection.insertOne(task);
    res.json({ ...task, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks", verifyUser, async (req, res) => {
  try {
    const tasks = await tasksCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid task ID" });
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid task ID" });
    const updates = req.body;
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.createdBy !== req.user.email) return res.status(403).json({ error: "You cannot edit this task" });
    const result = await tasksCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
    res.json(result.value);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid task ID" });
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/users", async (req, res) => {
  try {
    const { username, email, avatar_url } = req.body;
    if (!username || !email) return res.status(400).json({ error: "Missing fields" });
    const user = { username, email, avatar_url, createdAt: new Date() };
    const result = await usersCollection.insertOne(user);
    res.status(201).json({ ...user, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", verifyUser, async (req, res) => {
  try {
    const users = await usersCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
