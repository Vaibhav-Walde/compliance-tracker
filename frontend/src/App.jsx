import { useState, useEffect, useMemo } from "react";

const API = import.meta.env.VITE_API_URL || "";

const CATEGORIES = ["Tax", "Regulatory", "Corporate", "Audit", "Legal", "Other"];
const STATUSES = ["Pending", "In Progress", "Completed", "On Hold"];
const PRIORITIES = ["Low", "Medium", "High"];

const STATUS_STYLE = {
  "Pending":     { bg: "#FFFBEB", color: "#92400E" },
  "In Progress": { bg: "#EFF6FF", color: "#1E40AF" },
  "Completed":   { bg: "#F0FDF4", color: "#166534" },
  "On Hold":     { bg: "#F8FAFC", color: "#475569" },
};
const PRIORITY_STYLE = {
  "Low":    { bg: "#F0FDF4", color: "#166534" },
  "Medium": { bg: "#FFFBEB", color: "#92400E" },
  "High":   { bg: "#FEF2F2", color: "#991B1B" },
};

function isOverdue(task) {
  if (task.status === "Completed") return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = ["#2563EB","#7C3AED","#DB2777","#D97706","#16A34A","#0891B2"];
function avatarColor(name) {
  let h = 0; for (let c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, padding:"12px 20px", borderRadius:10,
      background: isErr ? "#FEF2F2" : "#F0FDF4", color: isErr ? "#991B1B" : "#166534",
      border: `1px solid ${isErr ? "#FCA5A5" : "#86EFAC"}`, fontSize:13, fontWeight:500,
      boxShadow:"0 4px 16px rgba(0,0,0,0.08)", display:"flex", alignItems:"center", gap:8 }}>
      <span>{isErr ? "✕" : "✓"}</span> {toast.msg}
    </div>
  );
}

function Spinner() {
  return <div style={{ width:20, height:20, border:"2px solid #E2E8F0", borderTopColor:"#2563EB",
    borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"40px auto" }} />;
}

function Badge({ label, style }) {
  return <span style={{ fontSize:11, fontWeight:500, padding:"3px 9px", borderRadius:99, ...style }}>{label}</span>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, width:"100%",
        maxWidth:500, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h2 style={{ fontSize:16, fontWeight:600 }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#94A3B8", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"16px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [newTask, setNewTask] = useState({ title:"", description:"", category:"Tax", due_date:"", status:"Pending", priority:"Medium" });
  const [newClient, setNewClient] = useState({ company_name:"", country:"", entity_type:"" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    setClientsLoading(true);
    fetch(`${API}/api/clients`)
      .then(r => r.json())
      .then(data => { setClients(Array.isArray(data) ? data : []); setClientsLoading(false); })
      .catch(() => { showToast("Could not connect to server", "error"); setClientsLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== "All") params.set("status", filterStatus);
    if (filterCategory !== "All") params.set("category", filterCategory);
    if (filterOverdue) params.set("overdue", "true");
    fetch(`${API}/api/clients/${selectedClient.id}/tasks?${params}`)
      .then(r => r.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { showToast("Failed to load tasks", "error"); setLoading(false); });
  }, [selectedClient, filterStatus, filterCategory, filterOverdue]);

  const filteredTasks = useMemo(() => {
    let t = [...tasks];
    if (search) t = t.filter(x =>
      x.title.toLowerCase().includes(search.toLowerCase()) ||
      (x.description || "").toLowerCase().includes(search.toLowerCase())
    );
    t.sort((a, b) => {
      if (sortBy === "due_date") return new Date(a.due_date) - new Date(b.due_date);
      if (sortBy === "priority") return PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });
    return t;
  }, [tasks, search, sortBy]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === "Pending").length,
    completed: tasks.filter(t => t.status === "Completed").length,
    overdue: tasks.filter(t => isOverdue(t)).length,
  }), [tasks]);

  async function handleAddClient() {
    const { company_name, country, entity_type } = newClient;
    if (!company_name || !country || !entity_type) return showToast("All fields are required", "error");
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/clients`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to create client", "error");
      setClients(prev => [...prev, data]);
      setSelectedClient(data);
      setNewClient({ company_name:"", country:"", entity_type:"" });
      setShowAddClient(false);
      showToast("Client added");
    } catch { showToast("Failed to create client", "error"); }
    finally { setSaving(false); }
  }

  async function handleAddTask() {
    if (!newTask.title || !newTask.due_date) return showToast("Title and due date are required", "error");
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/clients/${selectedClient.id}/tasks`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to create task", "error");
      setTasks(prev => [...prev, data]);
      setNewTask({ title:"", description:"", category:"Tax", due_date:"", status:"Pending", priority:"Medium" });
      setShowAddTask(false);
      showToast("Task added successfully");
    } catch { showToast("Failed to create task", "error"); }
    finally { setSaving(false); }
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/tasks/${editTask.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTask),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to update", "error");
      setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      setEditTask(null);
      showToast("Task updated");
    } catch { showToast("Failed to update task", "error"); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(taskId, status) {
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to update", "error");
      setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      showToast("Status updated");
    } catch { showToast("Failed to update status", "error"); }
  }

  async function handleDeleteTask(taskId) {
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) return showToast("Failed to delete task", "error");
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast("Task deleted");
    } catch { showToast("Failed to delete task", "error"); }
  }

  const taskForm = (data, setData) => (
    <>
      <FormField label="Title *">
        <input value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. GST Return Filing" />
      </FormField>
      <FormField label="Description">
        <textarea value={data.description || ""} onChange={e => setData(p => ({ ...p, description: e.target.value }))}
          rows={2} placeholder="Optional details" style={{ resize:"vertical" }} />
      </FormField>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FormField label="Category">
          <select value={data.category} onChange={e => setData(p => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Priority">
          <select value={data.priority} onChange={e => setData(p => ({ ...p, priority: e.target.value }))}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FormField label="Due Date *">
          <input type="date" value={data.due_date} onChange={e => setData(p => ({ ...p, due_date: e.target.value }))} />
        </FormField>
        <FormField label="Status">
          <select value={data.status} onChange={e => setData(p => ({ ...p, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
    </>
  );

  const btnPrimary = { background:"#1E40AF", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:500, fontSize:13 };
  const btnSecondary = { background:"none", color:"#475569", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"9px 18px", fontWeight:500, fontSize:13 };

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ width:260, background:"#0F172A", display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0 }}>
        <div style={{ padding:"20px 16px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".9"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".5"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity=".25"/>
              </svg>
            </div>
            <div>
              <div style={{ color:"#fff", fontWeight:600, fontSize:14 }}>LedgersCFO</div>
              <div style={{ color:"#64748B", fontSize:11 }}>Compliance Tracker</div>
            </div>
          </div>
        </div>
        <div style={{ padding:"0 12px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, fontWeight:600, color:"#475569", letterSpacing:"0.08em", textTransform:"uppercase" }}>Clients</span>
          <button onClick={() => setShowAddClient(true)} style={{ width:24, height:24, borderRadius:6, background:"#1E293B",
            border:"1px solid #334155", color:"#94A3B8", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 8px 12px" }}>
          {clientsLoading ? <div style={{ color:"#475569", fontSize:12, padding:"12px 8px" }}>Loading...</div> :
            clients.map(c => {
              const active = selectedClient?.id === c.id;
              const color = avatarColor(c.company_name);
              return (
                <div key={c.id} onClick={() => { setSelectedClient(c); setFilterStatus("All"); setFilterCategory("All"); setFilterOverdue(false); setSearch(""); }}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:10, marginBottom:2,
                    background: active ? "#1E3A8A" : "transparent", cursor:"pointer", transition:"background 0.15s" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background: color, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:11, fontWeight:600, color:"#fff", flexShrink:0 }}>
                    {initials(c.company_name)}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight: active ? 500 : 400, color: active ? "#fff" : "#CBD5E1",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.company_name}</div>
                    <div style={{ fontSize:11, color:"#475569" }}>{c.entity_type}</div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#F8F9FA" }}>
        {!selectedClient ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="10" width="36" height="28" rx="5" stroke="#CBD5E1" strokeWidth="2"/>
              <path d="M15 20h18M15 26h12" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{ fontSize:15, color:"#64748B", fontWeight:500 }}>Select a client to view tasks</div>
            <div style={{ fontSize:13, color:"#94A3B8" }}>or add a new client using the + button</div>
          </div>
        ) : (
          <>
            <div style={{ padding:"16px 28px", background:"#fff", borderBottom:"1px solid #E2E8F0",
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background: avatarColor(selectedClient.company_name),
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
                  {initials(selectedClient.company_name)}
                </div>
                <div>
                  <h1 style={{ fontSize:17, fontWeight:600, color:"#0F172A" }}>{selectedClient.company_name}</h1>
                  <div style={{ fontSize:12, color:"#64748B" }}>{selectedClient.entity_type} · {selectedClient.country}</div>
                </div>
              </div>
              <button onClick={() => setShowAddTask(true)} style={{ ...btnPrimary, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add Task
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, padding:"16px 28px",
              background:"#fff", borderBottom:"1px solid #E2E8F0" }}>
              {[
                { label:"Total Tasks", value: stats.total, color:"#1E40AF", bg:"#EFF6FF" },
                { label:"Pending", value: stats.pending, color:"#D97706", bg:"#FFFBEB" },
                { label:"Completed", value: stats.completed, color:"#16A34A", bg:"#F0FDF4" },
                { label:"Overdue", value: stats.overdue, color:"#DC2626", bg:"#FEF2F2" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius:10, padding:"12px 16px" }}>
                  <div style={{ fontSize:11, fontWeight:500, color: s.color, opacity:0.7, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:26, fontWeight:600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding:"12px 28px", background:"#fff", borderBottom:"1px solid #E2E8F0",
              display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
                style={{ width:200, padding:"8px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ width:"auto", padding:"8px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13, background:"#fff" }}>
                <option value="All">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                style={{ width:"auto", padding:"8px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13, background:"#fff" }}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ width:"auto", padding:"8px 12px", borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13, background:"#fff" }}>
                <option value="due_date">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="title">Sort: Title A-Z</option>
              </select>
              <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#475569", cursor:"pointer" }}>
                <input type="checkbox" checked={filterOverdue} onChange={e => setFilterOverdue(e.target.checked)} style={{ width:14, height:14 }} />
                Overdue only
              </label>
              {(filterStatus !== "All" || filterCategory !== "All" || filterOverdue || search) && (
                <button onClick={() => { setFilterStatus("All"); setFilterCategory("All"); setFilterOverdue(false); setSearch(""); }}
                  style={{ ...btnSecondary, padding:"6px 12px", fontSize:12, color:"#DC2626", borderColor:"#FCA5A5" }}>
                  Clear filters
                </button>
              )}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 28px" }}>
              {loading ? <Spinner /> : filteredTasks.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 0", color:"#94A3B8" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                  <div style={{ fontSize:14 }}>No tasks match your filters</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredTasks.map(task => {
                    const overdue = isOverdue(task);
                    const sc = STATUS_STYLE[task.status];
                    const pc = PRIORITY_STYLE[task.priority];
                    return (
                      <div key={task.id} style={{ background:"#fff", borderRadius:12,
                        border: overdue ? "1.5px solid #FCA5A5" : "1px solid #E2E8F0",
                        padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start",
                        boxShadow: overdue ? "0 0 0 3px #FEE2E2" : "none" }}>
                        {overdue && <div style={{ width:3, borderRadius:2, background:"#EF4444", alignSelf:"stretch", flexShrink:0 }} />}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                            <span style={{ fontSize:14, fontWeight:600, color:"#0F172A" }}>{task.title}</span>
                            {overdue && <Badge label="Overdue" style={{ background:"#FEE2E2", color:"#991B1B" }} />}
                          </div>
                          {task.description && (
                            <div style={{ fontSize:12, color:"#64748B", marginBottom:8, lineHeight:1.5 }}>{task.description}</div>
                          )}
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                            <Badge label={task.category} style={{ background:"#F1F5F9", color:"#475569" }} />
                            <Badge label={task.priority} style={{ background: pc.bg, color: pc.color }} />
                            <span style={{ fontSize:11, color: overdue ? "#DC2626" : "#94A3B8", fontWeight: overdue ? 600 : 400 }}>
                              Due {fmtDate(task.due_date)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
                          <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)}
                            style={{ fontSize:12, padding:"5px 8px", borderRadius:8, border:"1.5px solid #E2E8F0",
                              background: sc.bg, color: sc.color, fontWeight:500, cursor:"pointer", width:"auto" }}>
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <button onClick={() => setEditTask({ ...task })}
                            style={{ fontSize:12, padding:"5px 10px", border:"1.5px solid #E2E8F0", borderRadius:8,
                              background:"none", color:"#475569", fontWeight:500 }}>Edit</button>
                          <button onClick={() => handleDeleteTask(task.id)}
                            style={{ fontSize:12, padding:"5px 8px", border:"1.5px solid #FCA5A5", borderRadius:8,
                              background:"none", color:"#DC2626" }}>X</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={showAddTask} onClose={() => setShowAddTask(false)} title={`Add Task - ${selectedClient?.company_name}`}>
        {taskForm(newTask, setNewTask)}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
          <button onClick={() => setShowAddTask(false)} style={btnSecondary}>Cancel</button>
          <button onClick={handleAddTask} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Add Task"}</button>
        </div>
      </Modal>

      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
        {editTask && taskForm(editTask, setEditTask)}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
          <button onClick={() => setEditTask(null)} style={btnSecondary}>Cancel</button>
          <button onClick={handleSaveEdit} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </Modal>

      <Modal open={showAddClient} onClose={() => setShowAddClient(false)} title="Add New Client">
        <FormField label="Company Name *">
          <input value={newClient.company_name} onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))} placeholder="e.g. Apex Holdings Ltd" />
        </FormField>
        <FormField label="Country *">
          <input value={newClient.country} onChange={e => setNewClient(p => ({ ...p, country: e.target.value }))} placeholder="e.g. India" />
        </FormField>
        <FormField label="Entity Type *">
          <input value={newClient.entity_type} onChange={e => setNewClient(p => ({ ...p, entity_type: e.target.value }))} placeholder="e.g. Private Limited, LLC, LLP" />
        </FormField>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
          <button onClick={() => setShowAddClient(false)} style={btnSecondary}>Cancel</button>
          <button onClick={handleAddClient} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Add Client"}</button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}
