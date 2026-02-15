"use client";

import { useState } from "react";
import { Escalation, Agent } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, X, ArrowRight } from "lucide-react";

interface EscalationPanelProps {
  escalations: Escalation[];
  agents: Agent[];
  onAccept: (escalationId: number) => void;
  onDecline: (escalationId: number) => void;
}

export function EscalationPanel({ escalations, agents, onAccept, onDecline }: EscalationPanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (escalations.length === 0) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <Check className="h-5 w-5" />
          <span className="text-sm font-medium">No pending escalations</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {escalations.map((esc) => {
        const fromAgent = agents.find(a => a.id === esc.fromAgentId);
        const isExpanded = expanded === esc.id;

        return (
          <Card key={esc.id} className="overflow-hidden border-amber-200">
            <div 
              className="p-4 cursor-pointer hover:bg-amber-50/50"
              onClick={() => setExpanded(isExpanded ? null : esc.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-lg">{fromAgent?.emoji || "🔧"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{esc.title}</p>
                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                      {esc.reason.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From: {fromAgent?.name || "Unknown"} • Escalated just now
                  </p>
                </div>
                <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </div>
            </div>

            {isExpanded && (
              <div className="px-4 pb-4 border-t bg-amber-50/30">
                <p className="text-sm text-muted-foreground py-3">
                  {esc.details || `${fromAgent?.name} needs system-level assistance with this task.`}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => onAccept(esc.id)}
                  >
                    <Check className="h-4 w-4" />
                    Accept & Assign to Saraai
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDecline(esc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export function EscalationAlert({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;

  return (
    <Card className="p-3 bg-amber-50 border-amber-200 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{count} escalation{count > 1 ? "s" : ""} pending</p>
          <p className="text-xs text-muted-foreground">Agents need system help</p>
        </div>
        <Button size="sm" onClick={onClick}>
          View
        </Button>
      </div>
    </Card>
  );
}
