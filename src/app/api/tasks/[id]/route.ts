import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, activities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const { plan, status } = await request.json();
    
    const updates: any = {};
    if (plan) updates.planJson = plan;
    if (status) updates.status = status;
    
    await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId));

    // Log activity
    if (status === "assigned") {
      await db.insert(activities).values({
        taskId,
        type: "assigned",
        content: "Plan approved, task assigned to agent",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
