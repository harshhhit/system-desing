
import os, json, time, random
from kafka import KafkaConsumer, KafkaProducer

bootstrap = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
orders_topic = os.getenv("ORDERS_TOPIC", "orders")
retry_topic = os.getenv("RETRY_TOPIC", "orders.retry")
dlq_topic = os.getenv("DLQ_TOPIC", "orders.dlq")
max_retries = int(os.getenv("MAX_RETRIES", "3"))

consumer = KafkaConsumer(
    orders_topic,
    bootstrap_servers=bootstrap,
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    enable_auto_commit=False,
    group_id="orders-consumer-group",
)

producer = KafkaProducer(
    bootstrap_servers=bootstrap,
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

print(f"[KafkaWorker] Listening on topic '{orders_topic}' (bootstrap={bootstrap})")

for msg in consumer:
    data = msg.value
    retry_count = int(data.get("retry_count", 0))
    try:
        print("[KafkaWorker] Processing:", data)
        # Simulate failure deterministically for demo
        if data.get("should_fail") or random.random() < 0.2:
            raise RuntimeError("Simulated processing failure")
        # pretend to write to DB
        time.sleep(0.1)
        print("[KafkaWorker] Success:", data)
        consumer.commit()
    except Exception as e:
        retry_count += 1
        data["retry_count"] = retry_count
        if retry_count > max_retries:
            print("[KafkaWorker] Sending to DLQ:", data)
            producer.send(dlq_topic, value=data)
            consumer.commit()
        else:
            # small backoff by delaying requeue via retry topic
            print(f"[KafkaWorker] Retry {retry_count}/{max_retries}: requeue to {retry_topic}")
            producer.send(retry_topic, value=data)
            consumer.commit()
