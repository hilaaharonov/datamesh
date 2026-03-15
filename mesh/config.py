import os
from models import DataProduct

ARANGO_URL      = os.getenv("ARANGO_URL", "http://arangodb:8529")
ARANGO_USER     = os.getenv("ARANGO_USER", "root")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD", "rootpassword")
ARANGO_DB       = os.getenv("ARANGO_DB", "data_mesh")

DATA_PRODUCTS: list[DataProduct] = [
    DataProduct(
        name="todos",
        url="https://jsonplaceholder.typicode.com/todos/1",
        interval_seconds=60,
        collection="product_todos",
    ),
    DataProduct(
        name="users",
        url="https://jsonplaceholder.typicode.com/users/1",
        interval_seconds=120,
        collection="product_users",
    ),
]
