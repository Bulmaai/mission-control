"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Task } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanningModal } from "@/components/planning/PlanningModal";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

const columns = [
  { id: "inbox", label: "Inbox", color: "bg-gray-100" },
  { id: "planning", label: "Planning", color: "bg-blue-50" },
  { id: "assigned", label: "Assigned", color: "bg-purple-50" },
  { id: "in_progress", label: "In Progress", color: "bg-amber-50" },
  { id: "testing", label: "Testing", color: "bg-orange-50" },
  { id: "review", label: "Review", color: "bg-cyan-50" },
  { id: "done", label: "Done", color: "bg-green-50" },
];

export default function AgentBoardPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  const [agent, setAgent] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeColumn, setActiveColumn] = useState(3);
  const [planningTask, setPlanningTask] = useState<Task | null>(null);
  const [showPlanning, setShowPlanning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [agentId]);

  async function fetchData() {
    try {
      const [agentRes, tasksRes] = await Promise.all([
        fetch(`/api/agents/${agentId}`),
        fetch(`/api/agents/${agentId}/tasks`),
      ]);
      
      if (agentRes.ok) setAgent(await agentRes.json());
      if (tasksRes.ok) {
        const taskData = await tasksRes.json();
        setTasks(taskData);
        // Set active column to first column with tasks
        const colWithTasks = columns.findIndex(col => 
          taskData.some((t: Task) => t.status === col.id)
        );
        if (colWithTasks >= 0) setActiveColumn(colWithTasks);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Agent not found</div>
      </div>
    );
  }

  const currentColumn = columns[activeColumn];
  const columnTasks = tasks.filter((t) => t.status === currentColumn.id);

  const nextColumn = () => setActiveColumn((prev) => Math.min(prev + 1, columns.length - 1));
  const prevColumn = () => setActiveColumn((prev) => Math.max(prev - 1, 0));

  async function handlePlanComplete(taskId: number, plan: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status: "assigned" }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
    }
  }

  function startPlanning(task: Task) {
    setPlanningTask(task);
    setShowPlanning(true);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{agent.emoji}</span>
            <div>
              <h1 className="font-bold">{agent.name}</h1>
              <p className="text-xs text-muted-foreground">
                {agent.role === "system" ? "System Architect" : "Developer"}
              </p>
            </div>
          </div>
          <Button size="sm" className="ml-auto gap-1">
            <Plus className="h-4 w-4" />
            Task
          </Button>
        </div>
      </header>

      {/* Mobile Column Navigator */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevColumn}
            disabled={activeColumn === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${currentColumn.color}`}>
              {currentColumn.label}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              {columnTasks.length} tasks
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextColumn}
            disabled={activeColumn === columns.length - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Column dots indicator */}
        <div className="flex justify-center gap-1 mt-2">
          {columns.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveColumn(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === activeColumn ? "bg-primary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <main className="p-4">
        <div className="space-y-3">
          {columnTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tasks in {currentColumn.label}
            </div>
          ) : (
            columnTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onPlan={task.status === "planning" ? () => startPlanning(task) : undefined}
              />
            ))
          )}
        </div>
      </main>

      <PlanningModal
        task={planningTask}
        isOpen={showPlanning}
        onClose={() => setShowPlanning(false)}
        onComplete={handlePlanComplete}
      />
    </div>
  );
}

function TaskCard({ task, onPlan }: { task: Task; onPlan?: () => void }) {
  const priorityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-blue-100 text-blue-800",
    low: "bg-gray-100 text-gray-800",
  };

  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
      <h4 className="text-sm font-medium mb-3">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[task.priority || "medium"]}`}>
          {task.priority}
        </span>
        {task.isEscalation && (
          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            escalation
          </span>
        )}
        {task.estimatedMinutes && (
          <span className="text-xs text-muted-foreground">
            ~{Math.round(task.estimatedMinutes / 60)}h
          </span>
        )}
      </div>
      
      {onPlan && (
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full mt-2 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onPlan();
          }}
        >
          <Lightbulb className="h-4 w-4" />
          Plan with AI
        </Button>
      )}
    </Card>
  );
}
