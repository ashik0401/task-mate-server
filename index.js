require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
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
    if (!authHeader)
      return res.status(401).json({ error: "Authorization header required" });
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token required" });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: "Invalid token" });
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };
    next();
  } catch (err) {
    return res.status(500).json({ error: "Authentication failed" });
  }
}

app.post("/tasks", verifyUser, async (req, res) => {
  try {
    const { title, description, priority, status, assignedUser, dueDate } =
      req.body;
    if (!title || !assignedUser)
      return res.status(400).json({ error: "Missing required fields" });

    const task = {
      title,
      description,
      priority,
      status,
      assignedUser,
      dueDate,
      createdBy: req.user.email,
      createdAt: new Date(),
    };
    const result = await tasksCollection.insertOne(task);

    try {
      await supabase.from("task_events").insert([
        {
          action: "CREATE",
          task_title: title,
          task_id: result.insertedId.toString(),
          performed_by: req.user.email,
          performed_by_id: req.user.id,
          created_by: req.user.email,
          timestamp: new Date().toISOString(),
          broadcast: true,
        },
      ]);
    } catch (err) {
      console.error("Supabase event error:", err.message);
    }

    res.json({ ...task, _id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks", verifyUser, async (req, res) => {
  try {
    const tasks = await tasksCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    tasks.forEach((t) => (t._id = t._id.toString()));
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid task ID" });
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) return res.status(404).json({ error: "Task not found" });
    task._id = task._id.toString();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid task ID" });

    const { title, description, priority, status, assignedUser, dueDate } =
      req.body;
    if (!title || !assignedUser)
      return res.status(400).json({ error: "Missing required fields" });

    const updatedTask = {
      title,
      description,
      priority,
      status,
      assignedUser,
      dueDate,
      updatedAt: new Date(),
    };

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedTask }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Task not found" });

    try {
      await supabase.from("task_events").insert([
        {
          action: "UPDATE",
          task_title: title,
          task_id: id,
          performed_by: req.user.email,
          performed_by_id: req.user.id,
          timestamp: new Date().toISOString(),
          broadcast: true,
        },
      ]);
    } catch (err) {
      console.error("Supabase event error:", err.message);
    }

    res.json({ message: "Task updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", verifyUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid task ID" });

    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });

    try {
      await supabase.from("task_events").insert([
        {
          action: "DELETE",
          task_title: task.title,
          task_id: id,
          performed_by: req.user.email,
          timestamp: new Date().toISOString(),
          broadcast: true,
        },
      ]);
    } catch (err) {
      console.error("Supabase event error:", err.message);
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { username, email, avatar_url } = req.body;
    if (!username || !email)
      return res.status(400).json({ error: "Missing fields" });
    const user = { username, email, avatar_url, createdAt: new Date() };
    const result = await usersCollection.insertOne(user);
    res.status(201).json({ ...user, _id: result.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", verifyUser, async (req, res) => {
  try {
    const users = await usersCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    users.forEach((u) => (u._id = u._id.toString()));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
