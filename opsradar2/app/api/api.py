from fastapi import APIRouter

from app.api.v1.router_registry import include_api_routers


api_router = APIRouter()
include_api_routers(api_router)
