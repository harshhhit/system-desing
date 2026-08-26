
# Multiprotocol Messaging Starter (Django + Kafka + RabbitMQ)

A Docker Compose project showing **retries** and **dead-letter queues (DLQ)** using:
- **Kafka** topics: `orders`, `orders.retry`, `orders.dlq`
- **RabbitMQ** queues: `orders`, `orders.retry`, `orders.dlq`
- **Django REST API** to publish orders

## Requirements
- Docker & Docker Compose

## Start
```bash
docker compose up --build
```

Services:
- Django API: http://localhost:8000
- Kafka UI: http://localhost:8080
- RabbitMQ Management: http://localhost:15672  (guest/guest)

## Send Test Orders
Send an order that may succeed:
```bash
curl -X POST http://localhost:8000/api/orders -H "Content-Type: application/json" -d '{"order_id": 1}'
```
Send an order that forces failure (to exercise retries & DLQ):
```bash
curl -X POST http://localhost:8000/api/orders -H "Content-Type: application/json" -d '{"order_id": 2, "should_fail": true}'
```

## How Retries & DLQs Work

### Kafka
- `kafka_worker` consumes `orders`
- On failure, increments `retry_count` and republishes to `orders.retry`
- After `MAX_RETRIES` (default 3), publishes to `orders.dlq`

Observe topics in **Kafka UI**.

### RabbitMQ
- `rabbit_worker` consumes `orders` and `orders.retry`
- On failure, increments `retry_count` and publishes to `orders.retry`
- After `MAX_RETRIES`, publishes to `orders.dlq`

Inspect queues in **RabbitMQ Management UI**.

> Note: This demo implements backoff by republishing to a retry queue. In production, prefer TTL-based delayed queues or plugins to achieve exponential backoff and avoid hot-looping.

## Switch Brokers
- Toggle env vars in `docker-compose.yml` for `django_api`: `USE_KAFKA`, `USE_RABBIT`
- API exposes:
  - `POST /api/orders` → publishes to enabled brokers
  - `POST /api/orders/kafka` → Kafka only
  - `POST /api/orders/rabbit` → RabbitMQ only
  - `GET  /api/health`

## Extend
- Add DB persistence in workers
- Implement exponential backoff (RabbitMQ TTL + DLX, Kafka delayed retries)
- Add a DLQ Replayer service
- Add observability (Prometheus/Grafana, logs, tracing)

Enjoy!
