# NexFlow Backend Implementation: Work Item Service & AI Triage

This phase focuses on the **Work Item Service**, which handles the core DevOps logic and coordinates with the **AI Orchestration Layer** for triage.

## 1. API Definition: Work Item Creation & AI Triage

When a work item is created, it goes through an asynchronous triage process.

### Endpoint: `POST /api/v1/work-items`
**Request Body:**
```json
{
  "title": "Login failing for users in EU region",
  "description": "Getting 500 error on /auth/login. Seems related to the recent deployment.",
  "projectId": "uuid-123",
  "type": "BUG"
}
```

**Response (Immediate):**
```json
{
  "id": "uuid-456",
  "status": "QUEUED_FOR_TRIAGE",
  "message": "Work item created. AI is analyzing priority and category..."
}
```

---

## 2. Service Implementation (NestJS Skeleton)

```typescript
// services/work-item-service/src/work-item.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { WorkItemService } from './work-item.service';
import { RedisService } from './redis.service';

@Controller('work-items')
export class WorkItemController {
  constructor(
    private readonly workItemService: WorkItemService,
    private readonly redisService: RedisService
  ) {}

  @Post()
  async create(@Body() createDto: CreateWorkItemDto) {
    // 1. Persist to Postgres
    const item = await this.workItemService.create(createDto);

    // 2. Publish to Redis Streams for AI Triage
    await this.redisService.publish('events:triage', {
      type: 'WORK_ITEM_CREATED',
      payload: {
        id: item.id,
        title: item.title,
        description: item.description
      }
    });

    return {
      id: item.id,
      status: 'QUEUED_FOR_TRIAGE'
    };
  }
}
```

---

## 3. Redis Streams Event Structure

We use Redis Streams for the event-driven communication between the **Work Item Service** and **AI Orchestrator**.

| Stream Name | Event Type | Payload Fields | Consumer |
| :--- | :--- | :--- | :--- |
| `events:triage` | `WORK_ITEM_CREATED` | `id, title, description` | AI Orchestrator |
| `events:updates` | `TRIAGE_COMPLETED` | `id, suggested_priority, category` | Work Item Service |
| `events:realtime` | `UI_UPDATE` | `target_user_id, action, data` | Notification Service (WebSockets) |

---

## 4. AI Triage Processing Logic (Python/FastAPI)

The **AI Orchestrator** listens to the `events:triage` stream.

```python
# services/ai-orchestrator/src/triage_worker.py
import json
from redis import Redis
from llm_provider import get_completion

redis = Redis(host='localhost', port=6379)

def process_triage_stream():
    while True:
        # Read from Redis Stream
        events = redis.xread({'events:triage': '$'}, count=1, block=5000)
        
        for stream, messages in events:
            for message_id, data in messages:
                # 1. Analyze with LLM
                triage_result = get_completion(
                    prompt=f"Triage this ticket: {data['title']} - {data['description']}",
                    format="json"
                )
                
                # 2. Publish back to update the Work Item
                redis.xadd('events:updates', {
                    'type': 'TRIAGE_COMPLETED',
                    'id': data['id'],
                    'result': json.dumps(triage_result)
                })
```

---

## 5. Next Steps

1. **Deploy Redis & Postgres**: Spin up the containers for local testing.
2. **Frontend Wiring**: Implement the "Loading State" in the React dashboard that listens for the `TRIAGE_COMPLETED` WebSocket event.
3. **TimescaleDB Setup**: Initialize the metrics schema for the "CI/CD Visualiser".

Would you like me to provide the **Docker Compose** file to get this stack running locally, or the **Frontend React Code** for the real-time board?
