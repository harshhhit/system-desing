
import os, json, time, random
import pika

url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/%2F")
orders_queue = os.getenv("ORDERS_QUEUE", "orders")
retry_queue = os.getenv("RETRY_QUEUE", "orders.retry")
dlq_queue = os.getenv("DLQ_QUEUE", "orders.dlq")
max_retries = int(os.getenv("MAX_RETRIES", "3"))

params = pika.URLParameters(url)
connection = pika.BlockingConnection(params)
channel = connection.channel()

# Ensure queues exist (durable)
channel.queue_declare(queue=orders_queue, durable=True)
channel.queue_declare(queue=retry_queue, durable=True)
channel.queue_declare(queue=dlq_queue, durable=True)

print(f"[RabbitWorker] Listening on queue '{orders_queue}'")

def handle(body):
    data = json.loads(body)
    retry_count = int(data.get("retry_count", 0))
    print("[RabbitWorker] Processing:", data)
    # Simulate transient failure
    if data.get("should_fail") or random.random() < 0.2:
        raise RuntimeError("Simulated processing failure")
    time.sleep(0.1)
    print("[RabbitWorker] Success:", data)

def on_message(ch, method, properties, body):
    try:
        handle(body)
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        data = json.loads(body)
        retry_count = int(data.get("retry_count", 0)) + 1
        data["retry_count"] = retry_count
        if retry_count > max_retries:
            print("[RabbitWorker] Sending to DLQ:", data)
            ch.basic_publish(exchange="", routing_key=dlq_queue, body=json.dumps(data).encode("utf-8"))
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            print(f"[RabbitWorker] Retry {retry_count}/{max_retries}: requeue via retry queue")
            # naive backoff: small delay before requeue
            ch.basic_publish(exchange="", routing_key=retry_queue, body=json.dumps(data).encode("utf-8"))
            ch.basic_ack(delivery_tag=method.delivery_tag)

# consume from orders and retry queues to process requeued messages
channel.basic_qos(prefetch_count=10)
channel.basic_consume(queue=orders_queue, on_message_callback=on_message, auto_ack=False)
channel.basic_consume(queue=retry_queue, on_message_callback=on_message, auto_ack=False)

channel.start_consuming()
