import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { escalationId, action } = await request.json();
    
    if (!escalationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, escalationId))
      .limit(1);

    if (!task.length) {
      return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
    }

    if (action === "accept") {
      // Assign to Saraai
      await db
        .update(tasks)
        .set({ 
          assignedAgentId: "saraai",
          status: "assigned",
          assignedAt: new Date()
        })
        .where(eq(tasks.id, escalationId));

      // Log activity
      await db.insert(activities).values({
        taskId: escalationId,
        agentId: "saraai",
        type: "assigned",
        content: `Accepted escalation from ${task[0].escalatedFromAgentId}`,
      });

      return NextResponse.json({ success: true, message: "Escalation accepted" });
    } 
    
    if (action === "decline") {
      // Return to original agent
      await db
        .update(tasks)
        .set({ 
          isEscalation: false,
          status: "assigned"
        })
        .where(eq(tasks.id, escalationId));

      return NextResponse.json({ success: true, message: "Escalation declined" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to process escalation" }, { status: 500 });
  }
}
