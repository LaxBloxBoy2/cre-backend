from .assets import router as assets_router
from .tenants import router as tenants_router
from .leases import router as leases_router
from .rent_roll import router as rent_roll_router

__all__ = [
    'assets_router',
    'tenants_router',
    'leases_router',
    'rent_roll_router'
]
