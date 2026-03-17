import logging
import schedule
from db import get_db, ensure_collections
from collector import poll, poll_all
from config import DATA_PRODUCTS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)


if __name__ == "__main__":
    log.info("Starting data mesh collector...")

    db = get_db()
    ensure_collections(db)
    poll_all(db, DATA_PRODUCTS)

    for product in DATA_PRODUCTS:
        schedule.every(product.interval_seconds).seconds.do(poll, db=db, product=product)
        log.info(f"Scheduled '{product.name}' every {product.interval_seconds}s")

    while True:
        schedule.run_pending()