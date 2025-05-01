from pydantic import BaseModel
from typing import List

class TagUpdate(BaseModel):
    """Model for updating tags on a deal"""
    tags: List[str]
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "tags": ["multifamily", "core", "urban"]
            }
        }
    }
