import logging
import requests
from pydantic import ValidationError
from arango.database import StandardDatabase
from models import DataProduct, DataProductDocument
from db import insert_document

log = logging.getLogger(__name__)


def poll(db: StandardDatabase, product: DataProduct) -> None:
    """Poll a data product endpoint and store the result in ArangoDB."""
    try:
        log.info(f"Polling '{product.name}' at {product.url}")
        response = requests.get(product.url, timeout=10)
        response.raise_for_status()

        document = DataProductDocument(
            product=product.name,
            url=product.url,
            status_code=response.status_code,
            data=response.json(),
        )

        inserted = insert_document(db, product.collection, document.to_arango())
        log.info(f"Stored document from '{product.name}' → {inserted['_id']}")

    except ValidationError as e:
        log.error(f"Validation error from '{product.name}': {e}")
    except requests.exceptions.Timeout:
        log.error(f"Timeout polling '{product.name}'")
    except requests.exceptions.ConnectionError:
        log.error(f"Connection error polling '{product.name}'")
    except requests.exceptions.HTTPError as e:
        log.error(f"HTTP error polling '{product.name}': {e}")
    except Exception as e:
        log.error(f"Unexpected error polling '{product.name}': {e}")


def poll_all(db: StandardDatabase, products: list[DataProduct]) -> None:
    """Poll all registered data products."""
    for product in products:
        poll(db, product)
