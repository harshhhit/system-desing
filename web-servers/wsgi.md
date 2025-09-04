WSGI

Stands for Web Server Gateway Interface.

It’s a standard (a protocol) that defines how a Python web application talks to a web server.

Django, Flask, FastAPI (with some tweaks) can all use WSGI.

Think of it as a translator between your Python app and the web server.


WSGI

Stands for Web Server Gateway Interface.

It’s a standard (a protocol) that defines how a Python web application talks to a web server.

Django, Flask, FastAPI (with some tweaks) can all use WSGI.

Think of it as a translator between your Python app and the web server.

🔹 HTTP Server

A program that handles HTTP requests from the browser (like Chrome) and sends HTTP responses back.

Examples: Apache, Nginx, Gunicorn, uWSGI.

🔹 WSGI HTTP Server

A web server that understands WSGI so it can run Python web apps.

Popular examples:

Gunicorn → “Green Unicorn” (commonly used with Django/Flask).

uWSGI → very feature-rich, but more complex.

Daphne / Hypercorn → for async apps.

🔹 Why do we need this?

A Python app (Django, Flask) cannot talk directly to the internet.

Browsers send HTTP requests → Web server (Nginx/Apache) receives them → passes them to a WSGI server (Gunicorn/uWSGI) → which then calls your Python app → returns the response.

🔹 Modern note

WSGI is synchronous (one request at a time per worker).

For async apps (like FastAPI), there’s a newer standard called ASGI (Asynchronous Server Gateway Interface).

ASGI servers: Uvicorn, Daphne, Hypercorn.

What an HTTP Server Does

When you type a URL in your browser (like https://example.com), here’s what happens:

Browser sends an HTTP request

Example: GET /index.html HTTP/1.1

It includes headers (User-Agent, Cookies, etc.), maybe a body (if it’s POST).

HTTP server receives the request

The server listens on port 80 (HTTP) or 443 (HTTPS).

It parses the request: method (GET, POST…), path (/index.html), headers, body.

Server processes the request

If it’s just static content (like an image, HTML file), the server fetches it from disk.

If it’s dynamic content (e.g., Django app), it hands the request to a WSGI/ASGI app server (Gunicorn, Uvicorn, etc.).

Server builds an HTTP response

Example:


Common HTTP Servers
General-purpose HTTP servers

These are often used as reverse proxies or for serving static files:

Apache HTTP Server (httpd) – oldest, very flexible.

Nginx – lightweight, high-performance, widely used for reverse proxy + load balancing.

Caddy – modern server, automatic HTTPS.

LiteSpeed – optimized for performance, often used in hosting.

Python-specific WSGI/ASGI HTTP servers

These are made to run Python apps (Django, Flask, FastAPI):

Gunicorn (WSGI, synchronous apps like Django/Flask).

uWSGI (WSGI, very configurable but complex).

Waitress (WSGI, pure Python, often used on Windows).

Uvicorn (ASGI, async apps like FastAPI, Starlette).

Daphne (ASGI, originally for Django Channels).

Hypercorn (ASGI, supports HTTP/2 & HTTP/3).

✅ So when people say "HTTP server":

It could mean a general web server (Nginx, Apache).

Or a Python app server (Gunicorn, Uvicorn) that implements WSGI/ASGI.

Would you like me to also compare Nginx vs Gunicorn (since they’re often used together in Django deployments)?