# Mission Control

OpenClaw Agent Dashboard — orchestrate tasks across your agent fleet with kanban boards, real-time updates, and escalation handling.

**Live URL:** https://vmi3077352.tail0e0648.ts.net:8443/

**GitHub:** https://github.com/Bulmaai/mission-control

## Features

- **Dashboard Overview** — See all agents, current tasks, and activity feed at a glance
- **Real-time Updates** — Live data via Server-Sent Events (3-second refresh)
- **Kanban Boards** — Swipeable task boards per agent (Inbox → Planning → In Progress → Done)
- **Escalation System** — Agents can escalate system-level tasks to Saraai
- **Create Tasks** — Assign tasks to agents with priority levels
- **AI Planning** — Q&A workflow to generate execution plans for tasks

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** SQLite (better-sqlite3) + Drizzle ORM
- **Testing:** Vitest + React Testing Library

## Requirements

- Node.js 22+
- npm or pnpm

## Quick Start

```bash
# Clone
git clone https://github.com/Bulmaai/mission-control.git
cd mission-control

# Install
npm install

# Create .env file (optional)
cp .env.example .env

# Setup database (creates mission-control.db in project root)
npm run db:init

# Seed sample data
npm run db:seed

# Dev server
npm run dev
```

App runs at `http://localhost:3000`

## Production Deployment

```bash
# Build
npm run build

# Start (port 3000, or set PORT env var)
npm start
```

Or use PM2:
```bash
npm install -g pm2
pm2 start npm --name "mission-control" -- start
```

## Environment Variables

```bash
# Optional: OpenClaw Gateway connection
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your-token
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run db:init` | Initialize database |

## API Endpoints

### GET /api/agents
Returns all agents with stats and current tasks.

### GET /api/agents/:id/tasks
Returns tasks assigned to specific agent.

### POST /api/tasks
Create new task.

```json
{
  "title": "Task name",
  "description": "Details",
  "priority": "medium",
  "assignedAgentId": "bulmaai"
}
```

### POST /api/escalations
Accept or decline escalations.

```json
{
  "escalationId": 123,
  "action": "accept" | "decline"
}
```

## Project Structure

```
src/
├── app/              # Next.js routes
│   ├── api/          # API endpoints
│   ├── agents/[id]/  # Kanban board page
│   └── page.tsx      # Dashboard
├── components/       # React components
│   ├── escalation/   # Escalation UI
│   ├── planning/     # AI planning modal
│   └── tasks/        # Create task modal
├── lib/
│   ├── db/           # Database schema + client
│   └── openclaw/     # Gateway integration
└── types/            # TypeScript types
```

## Agents

| Agent | Role | Emoji | Description |
|-------|------|-------|-------------|
| Bulmaai | Developer | 🔧 | Senior software engineer — builds code, APIs, web apps |
| Saraai | System Architect | 🏗️ | System Architect & Infrastructure Orchestrator — handles escalations, server config, security |

*More specialist agents planned (9 total).*

## License

MIT
