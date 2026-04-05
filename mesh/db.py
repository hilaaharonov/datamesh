import logging
from arango import ArangoClient
from arango.database import StandardDatabase
import config

log = logging.getLogger(__name__)


def get_db() -> StandardDatabase:
    client = ArangoClient(hosts=config.ARANGO_URL)

    sys_db = client.db("_system", username=config.ARANGO_USER, password=config.ARANGO_PASSWORD)
    if not sys_db.has_database(config.ARANGO_DB):
        sys_db.create_database(config.ARANGO_DB)
        log.info(f"Created database '{config.ARANGO_DB}'")

    return client.db(config.ARANGO_DB, username=config.ARANGO_USER, password=config.ARANGO_PASSWORD)


def ensure_collections(db: StandardDatabase) -> None:
    """Create product collections and the edge collection if they don't exist."""
    config.sync_data_products_from_db()
    for product in config.DATA_PRODUCTS:
        if not db.has_collection(product.collection):
            db.create_collection(product.collection)
            log.info(f"Created collection '{product.collection}'")


def insert_document(db: StandardDatabase, collection: str, document: dict) -> dict:
    result = db.collection(collection).insert(document, return_new=True)
    return result["new"]
