import { getOpenClawClient } from "./client";
import { db } from "@/lib/db";
import { agents, tasks, activities } from "@/lib/db/schema";
import { eq, and, gte, count } from "drizzle-orm";

interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  role: string;
  color: string;
  isActive: boolean;
  currentTask?: {
    id: number;
    title: string;
    status: string;
    priority: string | null;
  };
  queueCount: number;
  completedToday: number;
}

interface SystemStatus {
  gatewayConnected: boolean;
  activeSessions: number;
  agents: AgentStatus[];
  escalations: {
    id: number;
    title: string;
    fromAgent: string;
    reason: string;
  }[];
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const client = getOpenClawClient();
  let gatewayConnected = false;
  let activeSessions = 0;

  // Try to connect to Gateway
  try {
    if (!client.isConnected()) {
      await client.connect();
    }
    gatewayConnected = client.isConnected();
    
    if (gatewayConnected) {
      const sessions = await client.listSessions();
      activeSessions = sessions.length;
    }
  } catch (err) {
    console.log("[Gateway] Not connected, using local data only");
  }

  // Get agent statuses from local DB
  const allAgents = await db.select().from(agents);
  
  const agentStatuses: AgentStatus[] = await Promise.all(
    allAgents.map(async (agent) => {
      // Current task (in_progress)
      const currentTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          priority: tasks.priority,
        })
        .from(tasks)
        .where(and(
          eq(tasks.assignedAgentId, agent.id), 
          eq(tasks.status, "in_progress")
        ))
        .limit(1);

      // Queue count (assigned status)
      const queueResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(and(
          eq(tasks.assignedAgentId, agent.id),
          eq(tasks.status, "assigned")
        ));

      // Completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(and(
          eq(tasks.assignedAgentId, agent.id),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, today)
        ));

      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji ?? "🤖",
        role: agent.role ?? "developer",
        color: agent.color ?? "bg-gray-500",
        isActive: Boolean(agent.isActive),
        currentTask: currentTasks[0] ?? undefined,
        queueCount: queueResult[0]?.count ?? 0,
        completedToday: completedResult[0]?.count ?? 0,
      };
    })
  );

  // Get pending escalations
  const escalations = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      fromAgent: agents.name,
      reason: tasks.escalationReason,
    })
    .from(tasks)
    .where(and(
      eq(tasks.isEscalation, true),
      eq(tasks.status, "assigned")
    ))
    .leftJoin(agents, eq(tasks.escalatedFromAgentId, agents.id));

  return {
    gatewayConnected,
    activeSessions,
    agents: agentStatuses,
    escalations: escalations.map(e => ({
      id: e.id,
      title: e.title ?? "Untitled",
      fromAgent: e.fromAgent ?? "Unknown",
      reason: e.reason ?? "system_request",
    })),
  };
}

export async function getRecentActivities(limit = 10) {
  const recentActivities = await db
    .select({
      id: activities.id,
      content: activities.content,
      type: activities.type,
      createdAt: activities.createdAt,
      agent: agents,
    })
    .from(activities)
    .leftJoin(agents, eq(activities.agentId, agents.id))
    .orderBy(activities.createdAt)
    .limit(limit);

  return recentActivities.map(a => ({
    ...a,
    agent: a.agent || { name: "System", emoji: "⚙️", color: "bg-gray-500" },
  }));
}
