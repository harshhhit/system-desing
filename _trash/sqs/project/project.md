Awesome—here’s a complete, Docker-based **Django + Kafka + RabbitMQ** project that implements **retries** and **DLQs** end-to-end. I’ve packaged it for you:

[Download the project (ZIP)](sandbox:/mnt/data/multiprotocol-messaging-starter.zip)

## What’s inside

* **Django API** (DRF) to publish orders to Kafka and/or RabbitMQ
* **Kafka worker** that consumes, retries via a retry topic, and finally dead-letters
* **RabbitMQ worker** that consumes, retries via a retry queue, and finally dead-letters
* **Kafka UI** for browsing topics
* **RabbitMQ Management UI** for browsing queues
* **docker-compose.yml** to run everything locally

## Quick start

1. Unzip and `cd multiprotocol-messaging-starter`
2. Run:

   ```bash
   docker compose up --build
   ```
3. Open:

   * Django API: [http://localhost:8000](http://localhost:8000)
   * Kafka UI: [http://localhost:8080](http://localhost:8080)
   * RabbitMQ UI: [http://localhost:15672](http://localhost:15672) (guest/guest)

## Send test messages

Success-ish (random failures are simulated in workers):

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"order_id": 1}'
```

Force a failure (to exercise retries & DLQ):

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"order_id": 2, "should_fail": true}'
```

## How retries & DLQs work here

* **Kafka**: `orders` → (on failure) `orders.retry` → (exceeds MAX\_RETRIES) `orders.dlq`
* **RabbitMQ**: `orders` → (on failure) `orders.retry` → (exceeds MAX\_RETRIES) `orders.dlq`

You can inspect messages moving through these topics/queues using the UIs above.

## Tweak it

* Turn brokers on/off for the API in `docker-compose.yml` (`USE_KAFKA`, `USE_RABBIT`)
* Set retry caps via `MAX_RETRIES` env variables for each worker
* Add persistence (DB) in workers, implement exponential backoff (RabbitMQ TTL + DLX; Kafka delayed-retry pattern), or build a DLQ “replayer” service

If you want, I can add **exponential backoff** with RabbitMQ TTL/DLX and Kafka delayed retries, or wire in **Postgres** to store processed orders.
