import { NextResponse } from "next/server";
import { getSystemStatus, getRecentActivities } from "@/lib/openclaw/service";

export async function GET() {
  try {
    const [status, activities] = await Promise.all([
      getSystemStatus(),
      getRecentActivities(10),
    ]);

    return NextResponse.json({
      agents: status.agents,
      activities,
      escalations: status.escalations,
      gatewayStatus: {
        connected: status.gatewayConnected,
        activeSessions: status.activeSessions,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system status" },
      { status: 500 }
    );
  }
}
