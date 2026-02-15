"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { Lightbulb, ChevronRight, Check, Loader2 } from "lucide-react";

interface PlanningModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: number, plan: string) => void;
}

interface PlanningQuestion {
  id: string;
  question: string;
  options?: string[];
  allowCustom?: boolean;
}

export function PlanningModal({ task, isOpen, onClose, onComplete }: PlanningModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  if (!isOpen) return null;
  if (!task) return null;

  const questions: PlanningQuestion[] = [
    {
      id: "goal",
      question: "What's the main goal of this task?",
      allowCustom: true,
    },
    {
      id: "approach",
      question: "What approach should we take?",
      options: ["Quick & Simple", "Robust & Scalable", "Experimental", "Follow Existing Pattern"],
    },
    {
      id: "priority",
      question: "Any specific constraints or priorities?",
      options: ["Speed (deliver fast)", "Quality (do it right)", "Cost (minimize resources)", "Security (lock it down)"],
    },
  ];

  function handleAnswer(answer: string) {
    const currentQ = questions[step];
    setAnswers({ ...answers, [currentQ.id]: answer });
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      generatePlan();
    }
  }

  async function generatePlan() {
    if (!task) return;
    setGenerating(true);
    
    // Simulate AI planning (in real impl, call Gateway)
    await new Promise(r => setTimeout(r, 1500));
    
    const generatedPlan = `## Execution Plan: ${task.title}

**Goal:** ${answers.goal || "Complete the task efficiently"}

**Approach:** ${answers.approach || "Standard implementation"}
**Priority:** ${answers.priority || "Balanced"}

### Steps:
1. Analyze requirements and current codebase
2. Implement core functionality
3. Test edge cases
4. Document changes
5. Submit for review

### Estimated Time: 2-4 hours`;
    
    setPlan(generatedPlan);
    setGenerating(false);
  }

  function handleComplete() {
    if (plan && task) {
      onComplete(task.id, plan);
      // Reset
      setStep(0);
      setAnswers({});
      setPlan(null);
      onClose();
    }
  }

  if (plan) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
        <div className="bg-background w-full sm:w-[500px] sm:rounded-xl rounded-t-xl p-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold">Plan Generated</h2>
          </div>
          
          <Card className="p-4 bg-muted/50 mb-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">{plan}</pre>
          </Card>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Edit
            </Button>
            <Button className="flex-1 gap-1" onClick={handleComplete}>
              <Check className="h-4 w-4" />
              Start Task
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[step];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:w-[400px] sm:rounded-xl rounded-t-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Plan Task</h2>
            <p className="text-xs text-muted-foreground">{task.title}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {step + 1} / {questions.length}
          </div>
        </div>

        {generating ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">AI is creating a plan...</p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4">{currentQ.question}</p>
            
            <div className="space-y-2">
              {currentQ.options ? (
                currentQ.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm">{option}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="w-full p-3 rounded-lg border bg-background"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAnswer((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <Button 
                    className="w-full"
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      if (input.value) handleAnswer(input.value);
                    }}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
