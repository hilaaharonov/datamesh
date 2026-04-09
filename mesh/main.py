import logging
import threading
import time

import schedule
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import config
from collector import poll, poll_all
from config import init_config, configure_new_dataproduct
from db import ensure_collections, get_db
from shared_models import DataProduct, DataProductDocument

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


def _current_products() -> list[DataProduct]:
    init_config()
    return config.DATA_PRODUCTS


def _schedule_products(products: list[DataProduct]) -> None:
    schedule.clear()
    for product in products:
        schedule.every(product.interval_seconds).seconds.do(poll, db=db, product=product)
        log.info("Scheduled '%s' every %ss", product.name, product.interval_seconds)


def _run_scheduler() -> None:
    log.info("Starting data mesh collector scheduler")
    products = _current_products()
    poll_all(db, products)
    _schedule_products(products)

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
    products = _current_products()
    return {"status": "ok", "products": [product.name for product in products]}


@app.delete("/products/{product_name}")
def delete_product(product_name: str) -> dict:
    products = _current_products()
    product = next((p for p in products if p.name == product_name), None)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Unknown product '{product_name}'")
    delete_result = config.delete_dataproduct(product_name)

    match delete_result:
        case config.Failure(error):
            log.error(f"Failed to delete data product '{product_name}': {error}")
            raise HTTPException(status_code=500, detail=f"Failed to delete data product '{product_name}'")
        case config.Success(_):
            log.info(f"Deleted data product '{product_name}' from configuration collection")
    with _scheduler_lock:
        config.sync_data_products_from_db()
        _schedule_products(config.DATA_PRODUCTS)
    log.info(f"Deleted data product '{product_name}' and its collection '{product.collection}'")
    return {"message": f"Data product '{product_name}' deleted successfully"}


@app.post("/add_data_product")
def add_data_product(product: DataProduct) -> dict:
    products = _current_products()
    if any(p.name == product.name for p in products):
        raise HTTPException(status_code=400, detail=f"Product with name '{product.name}' already exists")

    new_product = DataProduct(
        name=product.name,
        get_products_url=product.get_products_url,
        interval_seconds=product.interval_seconds,
        collection=f"product_{product.name}"
    )
    configure_new_dataproduct(new_product)
    products = _current_products()
    ensure_collections(db)
    with _scheduler_lock:
        _schedule_products(products)
    log.info(
        f"Added new data product '{new_product.name}' with URL '{new_product.get_products_url}' and interval {new_product.interval_seconds}s")
    return {"message": f"Data product '{new_product.name}' added successfully"}


@app.get("/products")
def get_products() -> list[dict]:
    products = _current_products()
    return [
        {
            "name": product.name,
            "collection": product.collection,
            "get_products_url": product.get_products_url,
            "interval_seconds": product.interval_seconds,
        }
        for product in products
    ]


def get_lateast_product(product_name: str) -> DataProductDocument:
    products = _current_products()
    product = next((p for p in products if p.name == product_name), None)
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


@app.get("/products/{product_name}/latest", response_model=DataProductDocument)
def get_latest_product_document(product_name: str) -> DataProductDocument:
    return get_lateast_product(product_name)


@app.get("/products/{product_name}/last_collect_time", response_model=list[str])
def get_last_collect_time(product_name: str) -> list[str]:
    return [get_lateast_product(product_name).collected_at]
