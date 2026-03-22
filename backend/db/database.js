const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "compliance.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    country TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    priority TEXT NOT NULL DEFAULT 'Medium',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
`);

function seed() {
  const count = db.prepare("SELECT COUNT(*) as n FROM clients").get();
  if (count.n > 0) return;

  const insertClient = db.prepare("INSERT INTO clients (id, company_name, country, entity_type) VALUES (?, ?, ?, ?)");
  const insertTask = db.prepare("INSERT INTO tasks (id, client_id, title, description, category, due_date, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

  const clients = [
    ["c1", "Apex Holdings Ltd", "India", "Private Limited"],
    ["c2", "BlueSky Ventures", "USA", "LLC"],
    ["c3", "Meridian Exports", "UK", "Partnership"],
    ["c4", "Nova Tech Pvt Ltd", "India", "Private Limited"],
  ];

  const tasks = [
    ["t1","c1","GST Return Filing – Q4","File quarterly GST returns for Q4 FY2025","Tax","2025-01-31","Completed","High"],
    ["t2","c1","Annual ROC Filing","File annual returns with Registrar of Companies","Regulatory","2025-09-30","Pending","High"],
    ["t3","c1","TDS Deposit – March","Deposit TDS for March payroll","Tax","2026-02-07","Pending","Medium"],
    ["t4","c1","Board Meeting Minutes","Document Q1 board meeting resolutions","Corporate","2026-04-15","Pending","Low"],
    ["t5","c2","Federal Tax Return","File Form 1120 for fiscal year","Tax","2025-03-15","Completed","High"],
    ["t6","c2","Delaware Franchise Tax","Pay annual franchise tax to Delaware","Regulatory","2026-03-01","Pending","High"],
    ["t7","c2","Payroll Compliance Audit","Internal review of payroll tax filings","Audit","2026-01-20","Pending","Medium"],
    ["t8","c3","VAT Return Q3","Submit VAT return for Q3 to HMRC","Tax","2025-11-07","Pending","High"],
    ["t9","c3","Companies House Filing","Submit confirmation statement","Regulatory","2026-05-10","Pending","Medium"],
    ["t10","c4","Advance Tax – Q3","Pay Q3 advance tax installment","Tax","2025-12-15","Pending","High"],
    ["t11","c4","MCA Annual Filing","File MGT-7 and AOC-4 with MCA","Regulatory","2025-11-29","Pending","High"],
  ];

  const seedAll = db.transaction(() => {
    clients.forEach(c => insertClient.run(...c));
    tasks.forEach(t => insertTask.run(...t));
  });
  seedAll();
  console.log("✅ Database seeded");
}

seed();

module.exports = db;