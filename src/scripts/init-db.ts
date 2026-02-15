import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../lib/db/schema";

const sqlite = new Database("./mission-control.db");
const db = drizzle(sqlite);

console.log("Creating tables...");

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    role TEXT NOT NULL,
    color TEXT,
    description TEXT,
    can_self_assign INTEGER DEFAULT 1,
    escalation_only INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'inbox',
    priority TEXT DEFAULT 'medium',
    assigned_agent_id TEXT REFERENCES agents(id),
    assigned_by TEXT DEFAULT 'user',
    is_escalation INTEGER DEFAULT 0,
    escalated_from_agent_id TEXT REFERENCES agents(id),
    escalation_reason TEXT,
    plan_json TEXT,
    session_id TEXT,
    board_id INTEGER,
    tags TEXT,
    estimated_minutes INTEGER,
    due_date INTEGER,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    assigned_at INTEGER,
    started_at INTEGER,
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id),
    agent_id TEXT REFERENCES agents(id),
    type TEXT NOT NULL,
    content TEXT,
    metadata TEXT,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    is_system_board INTEGER DEFAULT 0,
    owner_agent_id TEXT REFERENCES agents(id),
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("Tables created.");

// Seed agents
const existing = sqlite.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number };
if (existing.count === 0) {
  console.log("Seeding agents...");
  
  const stmt = sqlite.prepare(
    `INSERT INTO agents (id, name, emoji, role, color, description, can_self_assign, escalation_only) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    "bulma",
    "Bulma",
    "🔧",
    "developer",
    "bg-blue-500",
    "Senior software engineer - builds code, APIs, web apps",
    1,
    0
  );

  stmt.run(
    "saraai",
    "Saraai",
    "🦷",
    "system",
    "bg-amber-500",
    "System architect - handles infrastructure, escalations, server config",
    0,
    1
  );

  console.log("✅ Seeded Bulma and Saraai");
}

console.log("✅ Database initialized");
sqlite.close();
