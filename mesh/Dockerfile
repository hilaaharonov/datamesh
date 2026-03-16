FROM python:3.12-slim
WORKDIR /app

COPY shared_modules /shared_modules
COPY mesh/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

COPY mesh/ .

CMD ["python", "main.py"]