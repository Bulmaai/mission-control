import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  role: text("role").notNull(), // 'developer' | 'system' | 'specialist'
  color: text("color"),
  description: text("description"),
  canSelfAssign: integer("can_self_assign", { mode: "boolean" }).default(true),
  escalationOnly: integer("escalation_only", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("inbox"), // 'inbox' | 'planning' | 'assigned' | 'in_progress' | 'testing' | 'review' | 'done'
  priority: text("priority").default("medium"), // 'none' | 'low' | 'medium' | 'high' | 'critical'
  assignedAgentId: text("assigned_agent_id").references(() => agents.id),
  assignedBy: text("assigned_by").default("user"), // 'user' | 'system' | 'escalation'
  isEscalation: integer("is_escalation", { mode: "boolean" }).default(false),
  escalatedFromAgentId: text("escalated_from_agent_id").references(() => agents.id),
  escalationReason: text("escalation_reason"),
  planJson: text("plan_json"),
  sessionId: text("session_id"),
  boardId: integer("board_id"),
  tags: text("tags"), // JSON array
  estimatedMinutes: integer("estimated_minutes"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  assignedAt: integer("assigned_at", { mode: "timestamp" }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").references(() => tasks.id),
  agentId: text("agent_id").references(() => agents.id),
  type: text("type").notNull(), // 'created' | 'assigned' | 'started' | 'progress' | 'completed' | 'escalated' | 'comment' | 'system_event'
  content: text("content"),
  metadata: text("metadata"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const boards = sqliteTable("boards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon"),
  description: text("description"),
  isSystemBoard: integer("is_system_board", { mode: "boolean" }).default(false),
  ownerAgentId: text("owner_agent_id").references(() => agents.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export type Agent = typeof agents.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Board = typeof boards.$inferSelect;
