"use client";

import { useEffect, useState, useRef } from "react";
import { Agent, Task, Activity as ActivityType, Escalation } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EscalationPanel, EscalationAlert } from "@/components/escalation/EscalationPanel";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { 
  Plus, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Activity,
  ChevronRight,
  Settings,
  Wifi,
  WifiOff
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AgentWithStats extends Agent {
  currentTask?: Task;
  queueCount: number;
  completedToday: number;
}

interface SystemData {
  agents: AgentWithStats[];
  activities: ActivityType[];
  escalations: any[];
  gatewayStatus: { connected: boolean; activeSessions: number } | null;
}

export default function OverviewPage() {
  const router = useRouter();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [systemAgent, setSystemAgent] = useState<AgentWithStats | null>(null);
  const [activeAgents, setActiveAgents] = useState<AgentWithStats[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [showEscalations, setShowEscalations] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<{ connected: boolean; activeSessions: number } | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // HTTP fallback for initial load
  useEffect(() => {
    fetchInitialData();
  }, []);

  // SSE for real-time updates
  useEffect(() => {
    connectSSE();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  async function fetchInitialData() {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemData = await res.json();
      updateData(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateData(data: SystemData) {
    const allAgents = data.agents || [];
    const saraai = allAgents.find(a => a.id === "saraai");
    const others = allAgents.filter(a => a.id !== "saraai");
    
    setSystemAgent(saraai || null);
    setActiveAgents(others);
    setActivities(data.activities || []);
    setEscalations(data.escalations || []);
    setGatewayStatus(data.gatewayStatus || null);
  }

  function connectSSE() {
    console.log("[SSE] Connecting...");
    
    const evtSource = new EventSource("/api/sse");
    
    evtSource.onopen = () => {
      console.log("[SSE] Connected");
      setWsConnected(true);
    };
    
    evtSource.onmessage = (event) => {
      try {
        const data: SystemData = JSON.parse(event.data);
        updateData(data);
        setLoading(false);
      } catch (err) {
        console.error("[SSE] Failed to parse:", err);
      }
    };
    
    evtSource.onerror = () => {
      console.log("[SSE] Error/Disconnected");
      setWsConnected(false);
      evtSource.close();
      // Reconnect after 5 seconds
      setTimeout(connectSSE, 5000);
    };
    
    ws.current = evtSource as any;
  }

  async function handleAcceptEscalation(escalationId: number) {
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalationId, action: "accept" }),
      });
      if (res.ok) {
        // Refresh data
        fetchInitialData();
      }
    } catch (err) {
      console.error("Failed to accept escalation:", err);
    }
  }

  async function handleDeclineEscalation(escalationId: number) {
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalationId, action: "decline" }),
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error("Failed to decline escalation:", err);
    }
  }

  async function handleCreateTask(task: {
    title: string;
    description: string;
    priority: string;
    assignedAgentId: string;
  }) {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        fetchInitialData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Mission Control</h1>
              <div className="flex items-center gap-1">
                {gatewayStatus && (
                  <div className={`w-2 h-2 rounded-full ${gatewayStatus.connected ? "bg-green-500" : "bg-red-500"}`} title={gatewayStatus.connected ? "Gateway connected" : "Gateway offline"} />
                )}
                {wsConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-gray-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", { 
                weekday: "short", 
                day: "numeric", 
                month: "short" 
              })}
              {gatewayStatus?.connected && (
                <span className="ml-2 text-green-600">{gatewayStatus.activeSessions} sessions</span>
              )}
            </p>
          </div>
          <Button size="sm" className="gap-1" onClick={() => setShowCreateTask(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto sm:max-w-none">
        {/* Escalations Alert */}
        <EscalationAlert 
          count={escalations.length} 
          onClick={() => setShowEscalations(!showEscalations)} 
        />

        {/* Escalation Panel */}
        {showEscalations && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Pending Escalations
            </h2>
            <EscalationPanel 
              escalations={escalations}
              agents={agents}
              onAccept={handleAcceptEscalation}
              onDecline={handleDeclineEscalation}
            />
          </section>
        )}

        {/* System Architect Section */}
        {systemAgent && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">
                System Architect
              </h2>
            </div>
            <AgentCard agent={systemAgent} isSystem onClick={() => router.push(`/agents/${systemAgent.id}`)} />
          </section>
        )}

        {/* Active Agents Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Active Agents
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onClick={() => router.push(`/agents/${agent.id}`)} />
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-3 gap-2">
          <StatCard 
            label="In Progress" 
            value={[...activeAgents, systemAgent].filter(Boolean).reduce((a, b) => a + (b?.currentTask ? 1 : 0), 0)}
            icon={Clock}
          />
          <StatCard 
            label="Queued" 
            value={[...activeAgents, systemAgent].filter(Boolean).reduce((a, b) => a + (b?.queueCount || 0), 0)}
            icon={Activity}
          />
          <StatCard 
            label="Done Today" 
            value={[...activeAgents, systemAgent].filter(Boolean).reduce((a, b) => a + (b?.completedToday || 0), 0)}
            icon={CheckCircle2}
          />
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Recent Activity
            </h2>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View all
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <Card className="divide-y">
            {activities.slice(0, 5).map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
            {activities.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </Card>
        </section>
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal
        agents={agents}
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreate={handleCreateTask}
      />
    </div>
  );
}

function AgentCard({ agent, isSystem = false, onClick }: { agent: AgentWithStats; isSystem?: boolean; onClick?: () => void }) {
  return (
    <Card className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${isSystem ? "border-amber-200 dark:border-amber-800" : ""}`} onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${agent.color || "bg-gray-500"}`}>
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium truncate">{agent.name}</h3>
            <div className={`w-2 h-2 rounded-full ${agent.isActive ? "bg-green-500" : "bg-gray-400"}`} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {agent.role === "system" ? "System Architect" : "Developer"}
          </p>
          
          {agent.currentTask ? (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium truncate">{agent.currentTask.title}</p>
              <Badge variant="secondary" className="text-xs">
                {agent.currentTask.status.replace("_", " ")}
              </Badge>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              {agent.escalationOnly 
                ? `${agent.queueCount} system task${agent.queueCount !== 1 ? "s" : ""}`
                : `${agent.queueCount} in queue`
              }
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  icon: typeof Clock;
}) {
  return (
    <Card className="p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: ActivityType }) {
  const timeAgo = new Date(activity.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
        {activity.agent?.emoji || "🤖"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.agent?.name || "System"}</span>{" "}
          <span className="text-muted-foreground">{activity.content}</span>
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  );
}
