import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("./mission-control.db");
export const db = drizzle(sqlite, { schema });

// Seed initial agents if none exist
export function seedAgents() {
  const existing = sqlite.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number };
  if (existing.count > 0) return;

  const stmt = sqlite.prepare(
    `INSERT INTO agents (id, name, emoji, role, color, description, can_self_assign, escalation_only) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Bulma - Developer agent
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

  // Saraai - System architect
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

  console.log("✅ Seeded initial agents");
}

seedAgents();
