import logging
import threading
import time

import schedule
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from collector import poll, poll_all
from config import DATA_PRODUCTS
from db import ensure_collections, get_db
from shared_models import DataProductDocument

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

app = FastAPI(title="Mesh Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_db()
ensure_collections(db)

_scheduler_started = False
_scheduler_lock = threading.Lock()
_stop_event = threading.Event()


def _run_scheduler() -> None:
    log.info("Starting data mesh collector scheduler")
    poll_all(db, DATA_PRODUCTS)

    for product in DATA_PRODUCTS:
        schedule.every(product.interval_seconds).seconds.do(poll, db=db, product=product)
        log.info("Scheduled '%s' every %ss", product.name, product.interval_seconds)

    while not _stop_event.is_set():
        schedule.run_pending()
        time.sleep(1)


@app.on_event("startup")
def on_startup() -> None:
    global _scheduler_started
    with _scheduler_lock:
        if _scheduler_started:
            return
        worker = threading.Thread(target=_run_scheduler, daemon=True)
        worker.start()
        _scheduler_started = True


@app.on_event("shutdown")
def on_shutdown() -> None:
    _stop_event.set()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "products": [product.name for product in DATA_PRODUCTS]}


@app.get("/products")
def get_products() -> list[dict]:
    return [
        {
            "name": product.name,
            "collection": product.collection,
            "source_url": product.get_products_url,
            "interval_seconds": product.interval_seconds,
        }
        for product in DATA_PRODUCTS
    ]


@app.get("/products/{product_name}/latest", response_model=DataProductDocument)
def get_latest_product_document(product_name: str) -> DataProductDocument:
    product = next((p for p in DATA_PRODUCTS if p.name == product_name), None)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Unknown product '{product_name}'")

    cursor = db.aql.execute(
        """
        FOR doc IN @@collection
          SORT doc.collected_at DESC
          LIMIT 1
          RETURN doc
        """,
        bind_vars={"@collection": product.collection},
    )
    latest = next(cursor, None)
    if latest is None:
        raise HTTPException(status_code=404, detail=f"No documents found for '{product_name}'")

    return DataProductDocument(**latest)
