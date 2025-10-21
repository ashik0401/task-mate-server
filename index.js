require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({ origin: process.env.NEXT_FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const client = new MongoClient(process.env.MONGO_URI);
let db, tasksCollection;

async function connectDB() {
  await client.connect();
  db = client.db("TaskMate");
  tasksCollection = db.collection("tasks");
}
connectDB().catch(console.error);

async function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token required" });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Invalid or expired token" });
    req.user = { id: user.id, email: user.email, user_metadata: user.user_metadata };
    next();
  } catch {
    return res.status(500).json({ error: "Authentication failed" });
  }
}

app.post("/tasks", verifyUser, async (req, res) => {
  const { title, description, priority, status, assignedUser, dueDate } = req.body;
  const task = { title, description, priority, status, assignedUser, dueDate, createdBy: req.user.email, createdAt: new Date() };
  const result = await tasksCollection.insertOne(task);
  const insertedId = result.insertedId.toString();
  await supabase.from("notifications").insert([{ user_id: req.user.id, task_id: insertedId, action: "CREATE", title, created_at: new Date().toISOString() }]);
  res.json({ ...task, _id: insertedId });
});

app.patch("/tasks/:id", verifyUser, async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, assignedUser, dueDate } = req.body;
  const updatedTask = { title, description, priority, status, assignedUser, dueDate, updatedAt: new Date() };
  await tasksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedTask });
  await supabase.from("notifications").insert([{ user_id: req.user.id, task_id: id, action: "UPDATE", title, created_at: new Date().toISOString() }]);
  res.json({ message: "Task updated successfully" });
});

app.delete("/tasks/:id", verifyUser, async (req, res) => {
  const { id } = req.params;
  const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
  await tasksCollection.deleteOne({ _id: new ObjectId(id) });
  await supabase.from("notifications").insert([{ user_id: req.user.id, task_id: id, action: "DELETE", title: task.title, created_at: new Date().toISOString() }]);
  res.json({ message: "Task deleted successfully" });
});

app.get("/tasks", async (req, res) => {
  const tasks = await tasksCollection.find().sort({ createdAt: -1 }).toArray();
  tasks.forEach(t => t._id = t._id.toString());
  res.json(tasks);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
