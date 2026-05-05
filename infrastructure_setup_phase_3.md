# NexFlow Infrastructure & Metrics Setup

This phase focuses on the containerized environment and the **TimescaleDB** configuration for high-velocity metrics.

## 1. Local Development Environment (Docker Compose)

This `docker-compose.yml` spins up the core NexFlow data and messaging stack.

```yaml
version: '3.8'

services:
  # Core Relational & Time-Series Data
  nexflow-db:
    image: timescale/timescaledb:latest-pg15
    container_name: nexflow-db
    environment:
      - POSTGRES_DB=nexflow
      - POSTGRES_PASSWORD=postgres_pass
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  # Real-time Events & Caching
  nexflow-cache:
    image: redis:latest
    container_name: nexflow-cache
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]

  # Global Search
  nexflow-search:
    image: elasticsearch:8.10.2
    container_name: nexflow-search
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  # Message Broker (Optional if not using Redis Streams)
  # kafka:
  #   image: confluentinc/cp-kafka:latest
  #   ...
```

---

## 2. TimescaleDB Metrics Schema

We use **Hypertables** to store performance metrics from CI/CD pipelines and helpdesk ticket velocity.

```sql
-- Connect to nexflow-db
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 1. Pipeline Health Metrics
CREATE TABLE pipeline_metrics (
    time TIMESTAMPTZ NOT NULL,
    pipeline_id UUID NOT NULL,
    stage_name TEXT,
    duration_ms INTEGER,
    status VARCHAR(10), -- 'SUCCESS', 'FAILURE'
    cpu_usage_avg FLOAT,
    memory_usage_avg FLOAT
);

-- Convert to Hypertable (partitioned by time)
SELECT create_hypertable('pipeline_metrics', 'time');

-- 2. Ticket Velocity (For Predictive SLA Breach)
CREATE TABLE ticket_metrics (
    time TIMESTAMPTZ NOT NULL,
    queue_id UUID NOT NULL,
    incoming_count INTEGER,
    resolved_count INTEGER,
    avg_response_time_ms INTEGER
);

SELECT create_hypertable('ticket_metrics', 'time');
```

---

## 3. Predictive SLA Breach Logic

By querying the `ticket_metrics` hypertable, the **AI Orchestrator** can detect patterns:

```sql
-- Query to find 4-hour moving average of resolution time
SELECT
  time_bucket('1 hour', time) AS hour,
  AVG(avg_response_time_ms) OVER (ORDER BY time_bucket('1 hour', time) ROWS BETWEEN 4 PRECEDING AND CURRENT ROW) as moving_avg
FROM ticket_metrics
WHERE queue_id = 'uuid-hq'
ORDER BY hour DESC;
```

If the `moving_avg` exceeds the SLA threshold, the **AI Orchestrator** publishes a `BREACH_PREDICTION` event to the Redis Stream.

---

## 4. Next Steps

1. **Frontend Metrics Dashboard**: Build the charts using **Recharts** or **D3.js** to visualize the pipeline health.
2. **AI Copilot Prompting**: Refine the prompt used to generate resolution plans from incident metrics.
3. **CI/CD Mock Injector**: Create a script that simulates pipeline failures to test the "Deploy-to-Incident" correlation.

Would you like me to create the **Metrics Dashboard (Frontend)** or the **CI/CD Mock Injector** to test the system?
