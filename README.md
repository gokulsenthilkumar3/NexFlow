# NexFlow

**NexFlow** is a next-generation unified platform that merges DevOps workflows (Project Management, Pipelines) with a high-performance Helpdesk system. It bridges the gap between engineering teams and customer support, enabling seamless collaboration and AI-powered automation.

## 🚀 Key Features

- **Unified Workspace**: A single interface for both developers (Kanban/Scrum) and support agents (Tickets/SLAs).
- **AI Triage & Copilot**: Automatic ticket categorization, priority suggestions, and incident resolution plans.
- **CI/CD Visualizer**: Deep integration with GitHub/GitLab to show PR status and pipeline health directly inside work items.
- **Predictive SLA Breach**: Real-time monitoring of ticket velocity to predict and prevent SLA breaches.
- **Deploy-to-Incident Correlation**: Automatically links failing deployments to customer-reported issues.

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: NestJS (Node.js), Go, Python (AI Orchestrator)
- **Database**: PostgreSQL + TimescaleDB (Time-series metrics)
- **Messaging**: Redis Streams (Real-time events)
- **Search**: Elasticsearch (AI-powered Knowledge Base)
- **Infrastructure**: Kubernetes, Docker Compose

## 📂 Project Structure

```text
/nexflow
├── apps/
│   ├── web-app/            # Next.js Frontend Dashboard
│   └── customer-portal/    # Customer-facing ticketing (Planned)
├── services/
│   ├── work-item-service/  # NestJS backend for DevOps boards
│   └── ai-orchestrator/    # AI logic for triage and incidents (Planned)
├── packages/
│   └── shared-types/       # Common TypeScript models
└── docker-compose.yml      # Local development infrastructure
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gokulsenthilkumar3/NexFlow.git
   cd NexFlow
   ```

2. **Start Infrastructure:**
   ```bash
   docker-compose up -d
   ```

3. **Install Dependencies:**
   ```bash
   # From root (if using workspaces) or individually:
   cd apps/web-app && npm install
   cd ../../services/work-item-service && npm install
   ```

4. **Run the Apps:**
   ```bash
   # In web-app
   npm run dev
   
   # In work-item-service
   npm run start:dev
   ```

## 📄 License
This project is licensed under the MIT License.
