from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="NexFlow AI Orchestrator")

@app.get("/health")
def health_check():
    return {"status": "ok"}
