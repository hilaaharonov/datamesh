FROM python:3.12-slim

WORKDIR /app

COPY shared_modules /shared_modules
COPY team/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

COPY team/ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]