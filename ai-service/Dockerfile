FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=3002

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && python -m spacy download en_core_web_sm || true

COPY app ./app

EXPOSE 3002
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3002}"]
