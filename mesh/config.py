import os
from shared_modules.models import DataProduct

ARANGO_URL      = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_USER     = os.getenv("ARANGO_USER", "root")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD", "rootpassword")
ARANGO_DB       = os.getenv("ARANGO_DB", "data_mesh")

DATA_PRODUCTS: list[DataProduct] = [
    DataProduct(
        name="team",
        get_products_url="http://localhost:8001/data",
        interval_seconds=60,
        collection="product_team",
    ),
]
