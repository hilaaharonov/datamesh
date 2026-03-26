import logging
import requests
from pydantic import ValidationError
from arango.database import StandardDatabase
from shared_models import DataProduct, DataProductDocument
from db import insert_document

log = logging.getLogger(__name__)


def poll(db: StandardDatabase, product: DataProduct) -> None:
    """Poll a data product endpoint and store the result in ArangoDB."""
    try:
        log.info(f"Polling '{product.name}' at {product.get_products_url}")
        response = requests.get(product.get_products_url, timeout=10)
        response.raise_for_status()
        document = DataProductDocument(**response.json())
        inserted = insert_document(db, product.collection, document.to_arango())
        log.info(f"Stored document from '{product.name}' → {inserted['_id']}")

    except ValidationError as e:
        log.error(f"Data Product validation error from '{product.name}': {e}")
    except requests.exceptions.Timeout:
        log.error(f"Timeout polling '{product.name}'")
    except requests.exceptions.ConnectionError as e :
        log.error(f"Connection error polling '{product.name}': {e}")
    except requests.exceptions.HTTPError as e:
        log.error(f"HTTP error polling '{product.name}': {e}")
    except Exception as e:
        log.error(f"Unexpected error polling '{product.name}': {e}")


def poll_all(db: StandardDatabase, products: list[DataProduct]) -> None:
    """Poll all registered data products."""
    for product in products:
        poll(db, product)
