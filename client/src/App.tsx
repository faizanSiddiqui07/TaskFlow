import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

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

type Filter = "all" | "active" | "completed";

const API_URL = "https://taskflow-b5xo.onrender.com/tasks";

function isOverdue(task: Task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(date: string | null) {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        params: { filter, search }
      });
      setTasks(res.data.data);
    } catch {
      toast.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [filter, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      if (editingTask) {
        await axios.put(`${API_URL}/${editingTask.id}`, {
          title,
          description,
          dueDate: dueDate || null
        });
        toast.success("Task updated");
      } else {
        await axios.post(API_URL, {
          title,
          description,
          dueDate: dueDate || null
        });
        toast.success("Task created");
      }

      setTitle("");
      setDescription("");
      setDueDate("");
      setEditingTask(null);
      fetchTasks();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function toggleTask(task: Task) {
    try {
      await axios.patch(`${API_URL}/${task.id}/toggle`);
      fetchTasks();
    } catch {
      toast.error("Could not update task");
    }
  }

  async function deleteTask(task: Task) {
    const ok = window.confirm(`Delete "${task.title}"?`);
    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/${task.id}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch {
      toast.error("Could not delete task");
    }
  }

  function startEdit(task: Task) {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDueDate("");
  }

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length
    };
  }, [tasks]);

  return (
    <main className="app">
      <Toaster position="top-right" />

      <section className="hero">
  <div style={{ textAlign: "center" }}>

    <h1>TaskFlow</h1>

    <p className="subtitle">
      A personal task manager with task creation, search, filtering,
      due dates and progress tracking.
    </p>

  </div>
</section>

      <section className="stats">
        <div className="stat-card">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{editingTask ? "Edit task" : "Create new task"}</h2>
            <p>Add clear tasks with optional notes and due dates.</p>
          </div>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <label>
            Task title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
             placeholder="Example: Pay electricity bill"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
            />
          </label>

          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          <div className="form-actions">
            <button className="primary-btn" type="submit">
              {editingTask ? "Save changes" : "Add task"}
            </button>

            {editingTask && (
              <button className="secondary-btn" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="toolbar">
        <input
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks by title..."
        />

        <div className="filters">
          {(["all", "active", "completed"] as Filter[]).map((item) => (
            <button
              key={item}
              className={filter === item ? "filter active" : "filter"}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="task-list">
        {loading && <div className="empty">Loading tasks...</div>}

        {!loading && tasks.length === 0 && (
          <div className="empty">
            <h3>No tasks found</h3>
            <p>Create your first task or adjust your filters.</p>
          </div>
        )}

        {!loading &&
          tasks.map((task) => (
            <article
              className={`task-card ${task.completed ? "done" : ""} ${
                isOverdue(task) ? "overdue" : ""
              }`}
              key={task.id}
            >
              <div className="task-main">
                <button
                  className={task.completed ? "check checked" : "check"}
                  onClick={() => toggleTask(task)}
                  aria-label="Toggle task status"
                >
                  {task.completed ? "✓" : ""}
                </button>

                <div>
                  <div className="task-title-row">
                    <h3>{task.title}</h3>
                    {task.completed && <span className="badge success">Completed</span>}
                    {isOverdue(task) && <span className="badge danger">Overdue</span>}
                  </div>

                  {task.description && <p>{task.description}</p>}

                  <span className="date">Due: {formatDate(task.dueDate)}</span>
                </div>
              </div>

              <div className="task-actions">
                <button onClick={() => startEdit(task)}>Edit</button>
                <button className="danger-text" onClick={() => deleteTask(task)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}

export default App;
