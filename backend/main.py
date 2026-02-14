from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import schemas, database
from .routers import products, suppliers, orders, analytics, simulation, auth, reports

# models.Base.metadata.create_all(bind=database.engine) is not needed for MongoDB
# but we need to keep imports clean.

app = FastAPI(title="SCM System")

# CORS setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*" # Start by allowing all during development testing/deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to the SCM System API"}

app.include_router(products.router)
app.include_router(suppliers.router)
app.include_router(orders.router)
app.include_router(analytics.router)
app.include_router(simulation.router)
app.include_router(auth.router)
app.include_router(reports.router)
