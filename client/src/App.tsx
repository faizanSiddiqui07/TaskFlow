import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    axios.get("http://localhost:5000/tasks").then((res) => {
      setTasks(res.data);
    });
  }, []);

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Studio Graphene Assessment</p>
        <h1>TaskFlow</h1>
        <p>Clean full-stack personal task manager built with React and Node.js.</p>
      </section>

      <section className="card">
        <h2>Tasks</h2>

        {tasks.map((task) => (
          <div className="task" key={task.id}>
            <span>{task.completed ? "✅" : "⬜"}</span>
            <span>{task.title}</span>
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;