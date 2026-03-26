import os
from shared_models import DataProduct

ARANGO_URL      = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_USER     = os.getenv("ARANGO_USER", "root")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD", "rootpassword")
ARANGO_DB       = os.getenv("ARANGO_DB", "data_mesh")
TEAM_SERVICE_URL       = os.getenv("TEAM_SERVICE_URL", "http://team_service:8001/data")

DATA_PRODUCTS: list[DataProduct] = [
    DataProduct(
        name="team",
        get_products_url=TEAM_SERVICE_URL,
        interval_seconds=60,
        collection="product_team",
    ),
]
