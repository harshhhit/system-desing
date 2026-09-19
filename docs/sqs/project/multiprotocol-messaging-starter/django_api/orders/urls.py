
from django.urls import path
from orders_app.views import create_order, health, create_order_rabbit, create_order_kafka

urlpatterns = [
    path("api/health", health),
    path("api/orders", create_order),           # publishes to both if enabled
    path("api/orders/kafka", create_order_kafka),
    path("api/orders/rabbit", create_order_rabbit),
]
