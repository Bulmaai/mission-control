import { NextRequest } from "next/server";
import { getSystemStatus, getRecentActivities } from "@/lib/openclaw/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const sendUpdate = async () => {
        try {
          const [status, activities] = await Promise.all([
            getSystemStatus(),
            getRecentActivities(10),
          ]);
          
          const data = {
            agents: status.agents,
            activities,
            escalations: status.escalations,
            gatewayStatus: {
              connected: status.gatewayConnected,
              activeSessions: status.activeSessions,
            },
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error("[SSE] Error:", err);
        }
      };
      
      // Send immediately
      await sendUpdate();
      
      // Send every 3 seconds
      const interval = setInterval(sendUpdate, 3000);
      
      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
