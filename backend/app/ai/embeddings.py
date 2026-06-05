"""Mock embedding generation and similarity search.

Returns deterministic pseudo-random 1536-dimensional vectors so the
application can run end-to-end without an OpenAI API key.
"""

from __future__ import annotations

import hashlib
import struct
from typing import Any


def _deterministic_vector(seed: str, dim: int = 1536) -> list[float]:
    """Generate a deterministic float vector from a seed string.

    Uses SHA-256 based PRNG so the same input always yields the same vector,
    making tests reproducible.
    """
    values: list[float] = []
    idx = 0
    while len(values) < dim:
        digest = hashlib.sha256(f"{seed}:{idx}".encode()).digest()
        # Each sha256 gives 32 bytes → 8 floats
        for i in range(0, 32, 4):
            if len(values) >= dim:
                break
            # Unpack 4 bytes as an unsigned int, normalise to [-1, 1]
            raw = struct.unpack("I", digest[i : i + 4])[0]
            values.append((raw / 2**32) * 2 - 1)
        idx += 1
    return values[:dim]


async def generate_embedding(text: str) -> list[float]:
    """Generate a mock 1536-dimensional embedding for the given text.

    In production, replace this with a call to OpenAI's
    text-embedding-ada-002 or text-embedding-3-small.

    Args:
        text: The input text to embed.

    Returns:
        A list of 1536 floats in the range [-1, 1].
    """
    return _deterministic_vector(text)


async def similarity_search(
    query_embedding: list[float],
    candidate_embeddings: list[dict[str, Any]],
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """Perform a mock cosine-similarity search over candidate embeddings.

    Each candidate dict must have an 'embedding' key (list[float]) and
    an 'id' key.  Returns the top_k most similar candidates.

    Args:
        query_embedding: The query vector.
        candidate_embeddings: List of dicts with 'id' and 'embedding'.
        top_k: Number of results to return.

    Returns:
        List of dicts with 'id' and 'score', sorted by descending score.
    """
    results: list[dict[str, Any]] = []

    for candidate in candidate_embeddings:
        emb = candidate.get("embedding", [])
        if not emb:
            continue
        # Cosine similarity (simplified — mock vectors aren't unit-normalised)
        dot = sum(a * b for a, b in zip(query_embedding, emb))
        mag_q = sum(a * a for a in query_embedding) ** 0.5
        mag_c = sum(b * b for b in emb) ** 0.5
        score = dot / (mag_q * mag_c) if mag_q and mag_c else 0.0
        results.append({"id": candidate["id"], "score": round(score, 4)})

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:top_k]
