from fastapi import FastAPI
from . import risk  # import the local risk-score module from the current directory
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include risk route
app.include_router(risk.router, prefix="/api")
