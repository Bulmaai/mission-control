# API Documentation

## Agents

### GET /api/agents

Returns all active agents with their current status, tasks, and statistics.

**Response:**
```json
{
  "agents": [
    {
      "id": "bulmaai",
      "name": "Bulmaai",
      "emoji": "🔧",
      "role": "developer",
      "color": "bg-blue-500",
      "isActive": true,
      "currentTask": {
        "id": 1,
        "title": "Build auth API",
        "status": "in_progress",
        "priority": "high"
      },
      "queueCount": 2,
      "completedToday": 1
    }
  ],
  "activities": [...],
  "escalations": [...],
  "gatewayStatus": {
    "connected": true,
    "activeSessions": 3
  }
}
```

### GET /api/agents/:id

Returns specific agent details.

### GET /api/agents/:id/tasks

Returns all tasks assigned to agent.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Task name",
    "status": "in_progress",
    "priority": "high",
    "isEscalation": false
  }
]
```

## Tasks

### POST /api/tasks

Create new task and assign to agent.

**Request:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "priority": "low|medium|high|critical (default: medium)",
  "assignedAgentId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "taskId": 123
}
```

### PATCH /api/tasks/:id

Update task (plan, status, etc.)

**Request:**
```json
{
  "plan": "string (execution plan)",
  "status": "inbox|planning|assigned|in_progress|testing|review|done"
}
```

## Escalations

### POST /api/escalations

Accept or decline escalation requests.

**Request:**
```json
{
  "escalationId": 123,
  "action": "accept" | "decline"
}
```

**Actions:**
- `accept` — Assigns task to Saraai (system architect)
- `decline` — Returns task to original agent

## Real-time Updates

### GET /api/sse

Server-Sent Events endpoint for live dashboard updates.

Connects to stream and receives JSON data every 3 seconds:

```javascript
const evtSource = new EventSource('/api/sse');
evtSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI with latest data
};
```

## Error Responses

All endpoints return standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing fields) |
| 404 | Not Found |
| 500 | Server Error |

Error format:
```json
{
  "error": "Error message"
}
```
