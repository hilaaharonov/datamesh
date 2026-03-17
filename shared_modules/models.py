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
    """
    Pydantic model for data product documents.
    the actual data is not validated except for making share it's a JSON
    """

    product: str
    url: str
    data: dict | list
    collected_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    )

    def to_arango(self) -> dict:
        return self.model_dump()
