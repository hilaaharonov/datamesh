FROM python:3.12-slim
WORKDIR /app

COPY shared_models /shared_models
COPY mesh/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

COPY mesh/ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]

