import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, activities } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const { title, description, priority, assignedAgentId } = await request.json();
    
    if (!title || !assignedAgentId) {
      return NextResponse.json(
        { error: "Title and assigned agent required" },
        { status: 400 }
      );
    }

    // Insert task
    const result = await db.insert(tasks).values({
      title,
      description: description || null,
      priority: priority || "medium",
      status: "assigned",
      assignedAgentId,
      assignedBy: "user",
      createdAt: new Date(),
      assignedAt: new Date(),
    }).returning({ id: tasks.id });

    const taskId = result[0]?.id;

    // Log activity
    await db.insert(activities).values({
      taskId,
      agentId: assignedAgentId,
      type: "created",
      content: `Task "${title}" assigned`,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
