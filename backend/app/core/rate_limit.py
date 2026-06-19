import time
from collections import defaultdict
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Asynchronous memory-based rate limiting middleware.
    
    Tracks requests per client IP within a rolling 60-second window.
    """
    def __init__(self, app):
        super().__init__(app)
        self.limit = settings.RATE_LIMIT_REQUESTS_PER_MINUTE
        self.window = 60  # 60 seconds rolling window
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Exclude static assets, API docs, and health checks
        path = request.url.path
        if (
            path == "/" 
            or path == "/health" 
            or path.startswith("/docs") 
            or path.startswith("/redoc") 
            or path.startswith("/openapi.json")
            or path.startswith("/uploads")
        ):
            return await call_next(request)

        # Retrieve client IP
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Prune expired timestamps for this IP
        ip_requests = [t for t in self.requests[client_ip] if now - t < self.window]
        self.requests[client_ip] = ip_requests

        # Check budget
        if len(ip_requests) >= self.limit:
            retry_after = max(1, int(self.window - (now - ip_requests[0])))
            logger.warning(
                f"Rate limit exceeded: IP {client_ip} requested {len(ip_requests)} times. "
                f"Blocked for {retry_after}s."
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please slow down and try again later.",
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.limit),
                    "X-RateLimit-Remaining": "0",
                }
            )

        # Allow request and log timestamp
        self.requests[client_ip].append(now)
        
        # Process the request
        response = await call_next(request)
        
        # Add rate limit headers to the response
        remaining = max(0, self.limit - len(self.requests[client_ip]))
        response.headers["X-RateLimit-Limit"] = str(self.limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
