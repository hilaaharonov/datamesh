from datetime import datetime, timezone

from pydantic import BaseModel, Field


class DataProduct(BaseModel):
    """Represents a registered data product.
    Not stored in ArangoDB — used by the scheduler and collector."""

    name: str
    get_products_url: str
    interval_seconds: int = 120
    collection: str


class DataProductDocument(BaseModel):
    """Envelope stored in ArangoDB for every collected record.
    Domain data is stored as-is in `data` — no schema validation applied."""

    product: str
    url: str
    data: dict | list
    collected_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    )

    def to_arango(self) -> dict:
        return self.model_dump()
