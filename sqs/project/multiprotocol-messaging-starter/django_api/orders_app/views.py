
import os, json
from rest_framework.decorators import api_view
from rest_framework.response import Response

USE_KAFKA = os.getenv("USE_KAFKA", "1") == "1"
USE_RABBIT = os.getenv("USE_RABBIT", "1") == "1"

# Lazy init producers
_kafka_producer = None
_rabbit_conn = None
_rabbit_channel = None

def get_kafka_producer():
    global _kafka_producer
    if _kafka_producer is None:
        from kafka import KafkaProducer
        _kafka_producer = KafkaProducer(
            bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP", "kafka:9092"),
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
    return _kafka_producer

def get_rabbit_channel():
    global _rabbit_conn, _rabbit_channel
    if _rabbit_channel is None:
        import pika, urllib.parse
        url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/%2F")
        params = pika.URLParameters(url)
        _rabbit_conn = pika.BlockingConnection(params)
        _rabbit_channel = _rabbit_conn.channel()
        # declare queues to be safe
        _rabbit_channel.queue_declare(queue="orders", durable=True)
        _rabbit_channel.queue_declare(queue="orders.retry", durable=True)
        _rabbit_channel.queue_declare(queue="orders.dlq", durable=True)
    return _rabbit_channel

@api_view(["GET"])
def health(_request):
    return Response({"status": "ok"})

@api_view(["POST"])
def create_order(request):
    payload = request.data or {}
    payload.setdefault("retry_count", 0)

    if USE_KAFKA:
        get_kafka_producer().send("orders", value=payload)
    if USE_RABBIT:
        ch = get_rabbit_channel()
        ch.basic_publish(
            exchange="",
            routing_key="orders",
            body=json.dumps(payload).encode("utf-8"),
            properties=None,
        )
    return Response({"status": "queued", "kafka": USE_KAFKA, "rabbit": USE_RABBIT}, status=201)

@api_view(["POST"])
def create_order_kafka(request):
    payload = request.data or {}
    payload.setdefault("retry_count", 0)
    get_kafka_producer().send("orders", value=payload)
    return Response({"status": "queued-kafka"}, status=201)

@api_view(["POST"])
def create_order_rabbit(request):
    payload = request.data or {}
    payload.setdefault("retry_count", 0)
    ch = get_rabbit_channel()
    ch.basic_publish(exchange="", routing_key="orders", body=json.dumps(payload).encode("utf-8"))
    return Response({"status": "queued-rabbit"}, status=201)
