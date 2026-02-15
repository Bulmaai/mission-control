import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("./mission-control.db");
const db = drizzle(sqlite);

console.log("Adding sample data...");

// Sample tasks
const tasks = [
  {
    title: "Build auth API",
    description: "JWT authentication system with refresh tokens",
    status: "in_progress",
    priority: "high",
    assigned_agent_id: "bulma",
    assigned_by: "user",
    created_at: Date.now() - 1000 * 60 * 30, // 30 mins ago
    assigned_at: Date.now() - 1000 * 60 * 15,
    started_at: Date.now() - 1000 * 60 * 12,
  },
  {
    title: "Database schema design",
    description: "Design tables for user management",
    status: "done",
    priority: "medium",
    assigned_agent_id: "bulma",
    assigned_by: "user",
    created_at: Date.now() - 1000 * 60 * 60 * 2,
    assigned_at: Date.now() - 1000 * 60 * 60 * 1.5,
    started_at: Date.now() - 1000 * 60 * 60 * 1.2,
    completed_at: Date.now() - 1000 * 60 * 30,
  },
  {
    title: "Update server packages",
    description: "Security patches for Ubuntu",
    status: "in_progress",
    priority: "high",
    assigned_agent_id: "saraai",
    assigned_by: "system",
    created_at: Date.now() - 1000 * 60 * 60,
    assigned_at: Date.now() - 1000 * 60 * 50,
    started_at: Date.now() - 1000 * 60 * 45,
  },
  {
    title: "Docker setup for Redis",
    description: "Need Redis container for caching",
    status: "assigned",
    priority: "medium",
    assigned_agent_id: "saraai",
    assigned_by: "escalation",
    is_escalation: 1,
    escalated_from_agent_id: "bulma",
    escalation_reason: "infrastructure_needed",
    created_at: Date.now() - 1000 * 60 * 20,
    assigned_at: Date.now() - 1000 * 60 * 5,
  },
  {
    title: "Frontend dashboard components",
    description: "Build kanban board UI",
    status: "assigned",
    priority: "medium",
    assigned_agent_id: "bulma",
    assigned_by: "user",
    created_at: Date.now() - 1000 * 60 * 10,
    assigned_at: Date.now() - 1000 * 60 * 2,
  },
];

// Insert tasks
for (const task of tasks) {
  const columns = Object.keys(task).join(", ");
  const placeholders = Object.keys(task).map(() => "?").join(", ");
  const stmt = sqlite.prepare(`INSERT INTO tasks (${columns}) VALUES (${placeholders})`);
  stmt.run(...Object.values(task));
}

console.log(`✅ Added ${tasks.length} sample tasks`);

// Sample activities
const activities = [
  { agent_id: "bulma", type: "started", content: "Started \"Build auth API\"" },
  { agent_id: "bulma", type: "completed", content: "Completed \"Database schema design\"" },
  { agent_id: "saraai", type: "started", content: "Started \"Update server packages\"" },
  { agent_id: "bulma", type: "escalated", content: "Escalated: Need Redis/Docker setup" },
  { agent_id: "saraai", type: "assigned", content: "Accepted escalation from Bulma" },
];

for (const activity of activities) {
  const stmt = sqlite.prepare(
    `INSERT INTO activities (agent_id, type, content, created_at) VALUES (?, ?, ?, ?)`
  );
  stmt.run(activity.agent_id, activity.type, activity.content, Date.now() - Math.random() * 1000 * 60 * 30);
}

console.log(`✅ Added ${activities.length} sample activities`);
console.log("✅ Sample data ready");

sqlite.close();
