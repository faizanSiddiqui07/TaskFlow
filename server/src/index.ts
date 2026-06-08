import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const app = express();
const PORT = 5000;
const DB_PATH = path.join(__dirname, "../tasks.json");

app.use(cors());
app.use(express.json());

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

function readTasks(): Task[] {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeTasks(tasks: Task[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(tasks, null, 2));
}

app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "TaskFlow API running" });
});

app.get("/tasks", (req: Request, res: Response) => {
  let tasks = readTasks();
  const filter = String(req.query.filter || "all");
  const search = String(req.query.search || "").toLowerCase();

  if (filter === "active") tasks = tasks.filter((t) => !t.completed);
  if (filter === "completed") tasks = tasks.filter((t) => t.completed);
  if (search) tasks = tasks.filter((t) => t.title.toLowerCase().includes(search));

  tasks.sort((a, b) => a.position - b.position || b.createdAt.localeCompare(a.createdAt));

  res.json({ success: true, data: tasks });
});

app.post("/tasks", (req: Request, res: Response) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    return res.status(400).json({ success: false, error: "Title is required" });
  }

  const tasks = readTasks();
  const now = new Date().toISOString();

  const task: Task = {
    id: randomUUID(),
    title,
    description: req.body.description || null,
    dueDate: req.body.dueDate || null,
    completed: false,
    position: tasks.length,
    createdAt: now,
    updatedAt: now
  };

  tasks.push(task);
  writeTasks(tasks);

  res.status(201).json({ success: true, data: task });
});

app.put("/tasks/:id", (req: Request, res: Response) => {
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  const title = String(req.body.title || "").trim();

  if (!title) {
    return res.status(400).json({ success: false, error: "Title is required" });
  }

  tasks[index] = {
    ...tasks[index],
    title,
    description: req.body.description || null,
    dueDate: req.body.dueDate || null,
    updatedAt: new Date().toISOString()
  };

  writeTasks(tasks);
  res.json({ success: true, data: tasks[index] });
});

app.patch("/tasks/:id/toggle", (req: Request, res: Response) => {
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  tasks[index].completed = !tasks[index].completed;
  tasks[index].updatedAt = new Date().toISOString();

  writeTasks(tasks);
  res.json({ success: true, data: tasks[index] });
});

app.delete("/tasks/:id", (req: Request, res: Response) => {
  const tasks = readTasks();
  const filtered = tasks.filter((t) => t.id !== req.params.id);

  if (filtered.length === tasks.length) {
    return res.status(404).json({ success: false, error: "Task not found" });
  }

  writeTasks(filtered);
  res.json({ success: true, data: { id: req.params.id } });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
