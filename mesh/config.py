import os
from typing import List
from returns.result import Failure, Success, Result
from shared_models import DataProduct
import logging
from arango import ArangoClient

ARANGO_URL = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_USER = os.getenv("ARANGO_USER", "root")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD", "rootpassword")
ARANGO_DB = os.getenv("ARANGO_DB", "data_mesh")
TEAM_SERVICE_URL = os.getenv("TEAM_SERVICE_URL", "http://team_service:8001/data")
CONFIG_COLLECTION = "config"
DATA_PRODUCTS: List[DataProduct] = []
CONFIG_TYPE = List[dict[str, str]]


def _get_db():
    client = ArangoClient(hosts=ARANGO_URL)
    sys_db = client.db("_system", username=ARANGO_USER, password=ARANGO_PASSWORD)
    if not sys_db.has_database(ARANGO_DB):
        sys_db.create_database(ARANGO_DB)
        logging.info(f"Created database '{ARANGO_DB}'")
    return client.db(ARANGO_DB, username=ARANGO_USER, password=ARANGO_PASSWORD)


def init_config() -> None:
    """Initialize the configuration by syncing data products from the database."""
    result = sync_data_products_from_db()
    match result:
        case Success(_):
            logging.info("Configuration initialized successfully with data products from DB")
        case Failure(error):
            logging.error(f"Failed to initialize configuration: {error}")


def sync_data_products_from_db() -> Result[None, str]:
    """Fetch data product configurations from the database and update the global DATA_PRODUCTS list."""
    try:
        db = _get_db()
        config_collection = CONFIG_COLLECTION
        if not db.has_collection(config_collection):
            db.create_collection(config_collection)
            logging.info(f"Created collection '{config_collection}' for configuration")

        cursor = db.aql.execute(f"FOR doc IN {config_collection} RETURN doc")
        products = []
        for doc in cursor:
            logging.info(f"Loaded config from DB: {doc}")
            product = DataProduct(
                name=doc["name"],
                get_products_url=doc["get_products_url"],
                interval_seconds=doc["interval"],
                collection=doc["collection"]
            )
            products.append(product)

        global DATA_PRODUCTS
        DATA_PRODUCTS = products
        return Success(None)

    except Exception as e:
        error_message = f"Error syncing data products from DB: {e}"
        logging.error(error_message)
        return Failure(error_message)


def configure_new_dataproduct(product: DataProduct) -> None:
    """Add a new data product to the configuration collection in the db."""
    db = _get_db()
    if not db.has_collection(CONFIG_COLLECTION):
        db.create_collection(CONFIG_COLLECTION)
        logging.info(f"Created {CONFIG_COLLECTION} collection for storing data product configurations")
    db.collection(CONFIG_COLLECTION).insert({
        "name": product.name,
        "get_products_url": product.get_products_url,
        "interval": product.interval_seconds,
        "collection": product.collection,
    })
    logging.info(f"Added new data product '{product.name}' to configuration collection")
