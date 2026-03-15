import logging
from arango import ArangoClient
from arango.database import StandardDatabase
from config import ARANGO_URL, ARANGO_USER, ARANGO_PASSWORD, ARANGO_DB, DATA_PRODUCTS

log = logging.getLogger(__name__)


def get_db() -> StandardDatabase:
    """Connect to ArangoDB, creating the database if it doesn't exist."""
    client = ArangoClient(hosts=ARANGO_URL)

    # Must connect to _system first to create a new database
    sys_db = client.db("_system", username=ARANGO_USER, password=ARANGO_PASSWORD)
    if not sys_db.has_database(ARANGO_DB):
        sys_db.create_database(ARANGO_DB)
        log.info(f"Created database '{ARANGO_DB}'")

    return client.db(ARANGO_DB, username=ARANGO_USER, password=ARANGO_PASSWORD)


def ensure_collections(db: StandardDatabase) -> None:
    """Create product collections and the edge collection if they don't exist."""
    for product in DATA_PRODUCTS:
        if not db.has_collection(product.collection):
            db.create_collection(product.collection)
            log.info(f"Created collection '{product.collection}'")


def insert_document(db: StandardDatabase, collection: str, document: dict) -> dict:
    """Insert a document and return the result including the generated _id."""
    result = db.collection(collection).insert(document, return_new=True)
    return result["new"]
