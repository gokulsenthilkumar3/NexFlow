# NexFlow Frontend Prototype & AI Copilot

This phase delivers the **Unified Dashboard** UI and the **AI Copilot** prompting logic that powers the incident resolution feature.

## 1. Frontend Shell (Next.js + Tailwind)

We'll use a "Glassmorphism" design for the NexFlow Dashboard to achieve the premium aesthetic from the vision.

```tsx
// apps/web-app/components/DashboardLayout.tsx
import React from 'react';
import { Sidebar } from './Sidebar';
import { StatsCards } from './StatsCards';
import { KanbanBoard } from './KanbanBoard';
import { TicketQueue } from './TicketQueue';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              NexFlow Unified Command
            </h1>
            <div className="flex gap-4">
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs animate-pulse">
                System Healthy
              </span>
            </div>
          </header>

          {/* Core Layout: DevOps (Left) | Support (Right) */}
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold mb-4 text-slate-300">Engineering Pipeline (Kanban)</h2>
              <KanbanBoard />
            </div>

            <div className="col-span-4 space-y-8">
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold mb-4 text-slate-300">Live Ticket Queue</h2>
                <TicketQueue />
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-2 text-purple-300">✨ AI Copilot Insights</h2>
                <p className="text-sm text-slate-400 italic">
                  "Correlation detected: Pipeline failure #772 matches 12 tickets regarding 'login timeouts'. Suggested resolution plan generated."
                </p>
                <button className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-500 transition-colors rounded-lg font-medium">
                  Review Plan
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
```

---

## 2. AI Incident Copilot (Prompt Engineering)

This is the system prompt used by the **AI Orchestrator** when an incident is detected.

```markdown
# SYSTEM PROMPT: NEXFLOW_INCIDENT_COPILOT

CONTEXT:
An incident has been detected in the NexFlow ecosystem. You have access to:
- Pipeline ID and failure logs.
- Recent Support Tickets (subject, description, timestamp).
- Documentation snippets from the Knowledge Base.

TASK:
1. Validate if the support tickets are statistically linked to the pipeline failure.
2. Estimate the "Blast Radius" (e.g., "12% of EU users", "Premium Tier accounts").
3. Draft a 3-step resolution plan (e.g., Rollback, Clear Redis Cache, User Notification).

INPUT_JSON:
{
  "pipeline_error": "Timeout in 'deploy-auth-service' stage",
  "affected_tickets": [
    {"id": "T-90", "subject": "Can't log in", "desc": "500 error after 30s wait"}
  ],
  "kb_context": "The auth-service relies on the Redis cluster 'auth-cache'."
}

OUTPUT_FORMAT:
Return a valid JSON object with keys: [correlation_confidence, blast_radius, resolution_steps, customer_facing_message].
```

---

## 3. Real-time WebSocket Implementation

We use **Socket.io** to push the "AI Insights" to the frontend without a page refresh.

```javascript
// services/notification-svc/src/socket.gateway.ts
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // Called when AI Triage or Incident Correlation is complete
  handleAiEvent(event: any) {
    this.server.to(event.targetTeamId).emit('ai_insight', {
      message: event.summary,
      actionable_link: event.link
    });
  }
}
```

---

## 4. Final Next Steps for MVP

1. **Integrate Next.js & NestJS**: Connect the frontend to the backend via the BFF.
2. **Setup AI API Keys**: Configure OpenAI/Anthropic keys in the AI Orchestrator.
3. **End-to-End Test**: Simulate a "Failed Deploy" and watch the "AI Copilot" update the "Live Ticket Queue" in real-time.

**NexFlow is now architected, structured, and visually defined.** Should I generate the **actual React component files** for the Kanban and Ticket queues to finish the frontend shell?
