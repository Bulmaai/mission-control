"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types";
import { Plus, X } from "lucide-react";

interface CreateTaskModalProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description: string;
    priority: string;
    assignedAgentId: string;
  }) => void;
}

export function CreateTaskModal({ agents, isOpen, onClose, onCreate }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedAgentId, setAssignedAgentId] = useState(agents[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const priorities = [
    { id: "low", label: "Low", color: "bg-gray-100" },
    { id: "medium", label: "Medium", color: "bg-blue-100" },
    { id: "high", label: "High", color: "bg-orange-100" },
    { id: "critical", label: "Critical", color: "bg-red-100" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    
    setSubmitting(true);
    onCreate({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignedAgentId,
    });
    setSubmitting(false);
    
    // Reset form
    setTitle("");
    setDescription("");
    setPriority("medium");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:w-[400px] sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">New Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <Label>Priority</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    priority === p.id
                      ? p.color + " ring-2 ring-offset-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Assign to</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {agents.filter(a => !a.escalationOnly).map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setAssignedAgentId(agent.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    assignedAgentId === agent.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <span className="text-sm font-medium truncate">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!title.trim() || submitting}
            >
              {submitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
