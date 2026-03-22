const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const db = require("./db/database");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", message: "Compliance Tracker API" }));

// CLIENTS
app.get("/api/clients", (req, res) => {
  try {
    const clients = db.prepare("SELECT * FROM clients ORDER BY company_name ASC").all();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

app.get("/api/clients/:id", (req, res) => {
  try {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

app.post("/api/clients", (req, res) => {
  try {
    const { company_name, country, entity_type } = req.body;
    if (!company_name || !country || !entity_type)
      return res.status(400).json({ error: "company_name, country, and entity_type are required" });
    const id = randomUUID();
    db.prepare("INSERT INTO clients (id, company_name, country, entity_type) VALUES (?, ?, ?, ?)").run(id, company_name.trim(), country.trim(), entity_type.trim());
    const created = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create client" });
  }
});

app.delete("/api/clients/:id", (req, res) => {
  try {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ message: "Client deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// TASKS
const VALID_STATUSES = ["Pending", "In Progress", "Completed", "On Hold"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];
const VALID_CATEGORIES = ["Tax", "Regulatory", "Corporate", "Audit", "Legal", "Other"];

app.get("/api/clients/:clientId/tasks", (req, res) => {
  try {
    const client = db.prepare("SELECT id FROM clients WHERE id = ?").get(req.params.clientId);
    if (!client) return res.status(404).json({ error: "Client not found" });
    let query = "SELECT * FROM tasks WHERE client_id = ?";
    const params = [req.params.clientId];
    if (req.query.status && req.query.status !== "All") { query += " AND status = ?"; params.push(req.query.status); }
    if (req.query.category && req.query.category !== "All") { query += " AND category = ?"; params.push(req.query.category); }
    if (req.query.overdue === "true") { query += " AND due_date < date('now') AND status != 'Completed'"; }
    query += " ORDER BY due_date ASC";
    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/clients/:clientId/tasks", (req, res) => {
  try {
    const client = db.prepare("SELECT id FROM clients WHERE id = ?").get(req.params.clientId);
    if (!client) return res.status(404).json({ error: "Client not found" });
    const { title, description, category, due_date, status, priority } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "title is required" });
    if (!due_date) return res.status(400).json({ error: "due_date is required" });
    if (!category || !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` });
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
    if (priority && !VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: "Invalid priority" });
    const id = randomUUID();
    db.prepare("INSERT INTO tasks (id, client_id, title, description, category, due_date, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, req.params.clientId, title.trim(), description?.trim() || "", category, due_date, status || "Pending", priority || "Medium");
    const created = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.patch("/api/tasks/:id", (req, res) => {
  try {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const { title, description, category, due_date, status, priority } = req.body;
    if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });
    if (priority && !VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: "Invalid priority" });
    if (category && !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: "Invalid category" });
    const updated = {
      title: title?.trim() || task.title,
      description: description?.trim() ?? task.description,
      category: category || task.category,
      due_date: due_date || task.due_date,
      status: status || task.status,
      priority: priority || task.priority,
    };
    db.prepare("UPDATE tasks SET title=?, description=?, category=?, due_date=?, status=?, priority=? WHERE id=?").run(updated.title, updated.description, updated.category, updated.due_date, updated.status, updated.priority, req.params.id);
    const result = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  try {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));