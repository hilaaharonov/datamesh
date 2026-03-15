from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Any


class DataProduct(BaseModel):
    """Represents a registered data product.
    Not stored in ArangoDB — used by the scheduler and collector."""

    name: str
    url: str
    interval_seconds: int = 60
    collection: str


class DataProductDocument(BaseModel):
    """Envelope stored in ArangoDB for every collected record.
    Domain data is stored as-is in `data` — no schema validation applied."""

    product: str
    url: str
    status_code: int
    data: dict | list
    collected_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def to_arango(self) -> dict:
        return self.model_dump()