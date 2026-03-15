import os
import logging
from arango import ArangoClient
from arango.database import StandardDatabase

log = logging.getLogger(__name__)

ARANGO_URL      = os.getenv("ARANGO_URL", "http://localhost:8529")
ARANGO_USER     = os.getenv("ARANGO_USER", "root")
ARANGO_PASSWORD = os.getenv("ARANGO_PASSWORD", "rootpassword")
ARANGO_DB       = os.getenv("ARANGO_DB", "team_service")
COLLECTION_NAME = "team_members"


def get_db() -> StandardDatabase:
    """Connect to ArangoDB, creating the database if it doesn't exist."""
    client = ArangoClient(hosts=ARANGO_URL)

    sys_db = client.db("_system", username=ARANGO_USER, password=ARANGO_PASSWORD)
    if not sys_db.has_database(ARANGO_DB):
        sys_db.create_database(ARANGO_DB)
        log.info(f"Created database '{ARANGO_DB}'")

    db = client.db(ARANGO_DB, username=ARANGO_USER, password=ARANGO_PASSWORD)

    if not db.has_collection(COLLECTION_NAME):
        db.create_collection(COLLECTION_NAME)
        log.info(f"Created collection '{COLLECTION_NAME}'")

    return db
