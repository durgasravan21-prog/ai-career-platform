import multiprocessing
import os

bind = "0.0.0.0:8000"

# Dynamically calculate the number of worker processes: (2 * CPU_cores) + 1
# Under low-CPU environments (like container clusters with CPU limits), allows setting via WEB_CONCURRENCY.
workers = int(os.environ.get("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))

# Use Uvicorn worker for async ASGI capabilities in Gunicorn
worker_class = "uvicorn.workers.UvicornWorker"

# Keepalive keeps connections open longer to avoid overhead on next requests
keepalive = 120
timeout = 120

# Structured log configuration
loglevel = "info"
accesslog = "-"  # log to stdout
errorlog = "-"   # log to stderr
