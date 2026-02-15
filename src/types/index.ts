export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: "developer" | "system" | "specialist";
  color: string;
  description: string;
  canSelfAssign: boolean;
  escalationOnly: boolean;
  isActive: boolean;
  currentTask?: Task;
  queueCount: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignedAgentId?: string;
  assignedBy: "user" | "system" | "escalation";
  isEscalation: boolean;
  escalatedFromAgentId?: string;
  escalationReason?: string;
  estimatedMinutes?: number;
  dueDate?: Date;
  createdAt: Date;
  agent?: Agent;
}

export type TaskStatus =
  | "inbox"
  | "planning"
  | "assigned"
  | "in_progress"
  | "testing"
  | "review"
  | "done";

export type Priority = "none" | "low" | "medium" | "high" | "critical";

export interface Activity {
  id: number;
  taskId?: number;
  agentId?: string;
  type: ActivityType;
  content: string;
  createdAt: Date;
  agent?: Agent;
}

export type ActivityType =
  | "created"
  | "assigned"
  | "started"
  | "progress"
  | "completed"
  | "escalated"
  | "comment"
  | "system_event";

export interface Escalation {
  id: number;
  taskId?: number;
  title: string;
  fromAgentId?: string;
  fromAgent?: string;
  toAgentId?: string;
  reason: string;
  details?: string;
  status?: "pending" | "accepted" | "declined" | "resolved";
  createdAt?: Date;
}
