from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import enum

app = FastAPI(title="Helpdesk Service")

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketBase(BaseModel):
    title: str
    description: str
    customer_id: str
    priority: str = "medium"

class TicketCreate(TicketBase):
    pass

class Ticket(TicketBase):
    id: int
    status: TicketStatus
    created_at: datetime
    assigned_agent_id: Optional[str] = None

    class Config:
        from_attributes = True

# Dummy database
tickets = []

@app.post("/tickets", response_model=Ticket)
async def create_ticket(ticket_in: TicketCreate):
    new_ticket = Ticket(
        id=len(tickets) + 1,
        status=TicketStatus.OPEN,
        created_at=datetime.utcnow(),
        **ticket_in.dict()
    )
    # AI Triage Trigger Placeholder
    # await trigger_ai_triage(new_ticket)
    tickets.append(new_ticket)
    return new_ticket

@app.get("/tickets", response_model=List[Ticket])
async def list_tickets(status: Optional[TicketStatus] = None):
    if status:
        return [t for t in tickets if t.status == status]
    return tickets

@app.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: int):
    for t in tickets:
        if t.id == ticket_id:
            return t
    raise HTTPException(status_code=404, detail="Ticket not found")
