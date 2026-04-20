FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5002

CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5002} --workers 1 --timeout 120"]
