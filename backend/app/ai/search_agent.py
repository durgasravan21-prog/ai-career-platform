import logging
from typing import List, Dict, Any, Optional
from app.ai.llm import call_llm_json

logger = logging.getLogger(__name__)

async def filter_candidates_ai(
    search_query: str,
    candidates: List[Dict[str, Any]],
    candidate_type: str = "project"
) -> List[Dict[str, Any]]:
    """
    Evaluates, filters, and ranks candidate records against a natural language search query.
    
    Args:
        search_query: User's natural language query (e.g. "beginner backend python").
        candidates: List of candidate dicts (must contain at least 'id', 'title'/'name', 'description').
        candidate_type: The entity type: "project", "mentor", or "role".
        
    Returns:
        List of candidate dicts that matched, sorted by relevance score descending.
    """
    if not search_query.strip() or not candidates:
        return candidates

    from app.ai.llm import get_api_keys
    gemini_key, openai_key = get_api_keys()

    # If no keys, do a simple regex/substring fallback
    if not (gemini_key or openai_key):
        logger.info("No API keys for Search Filtering Agent. Using fallback substring search.")
        query_words = [w.lower() for w in search_query.split() if len(w) > 2]
        if not query_words:
            return candidates
            
        matched = []
        for c in candidates:
            # Check title, name, description, tech stack
            text_pool = (
                str(c.get("title") or c.get("name") or "") + " " +
                str(c.get("description") or c.get("bio") or "") + " " +
                str(c.get("tech_stack") or c.get("expertise") or "")
            ).lower()
            
            # Simple scoring based on word matching
            score = sum(1 for w in query_words if w in text_pool)
            if score > 0:
                # Add a pseudo score
                c_copy = dict(c)
                c_copy["relevance_score"] = score
                matched.append(c_copy)
        
        matched.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return matched

    # Prompt the AI agent to filter and rank
    prompt = (
        f"You are an AI Search and Filtering Agent. Your task is to match a user's natural language query against a list of candidate {candidate_type}s.\n"
        f"User Query: \"{search_query}\"\n\n"
        f"Candidates:\n"
    )
    
    for i, c in enumerate(candidates):
        c_id = c.get("id")
        name = c.get("title") or c.get("name") or "Unnamed"
        desc = c.get("description") or c.get("bio") or ""
        difficulty = c.get("difficulty") or ""
        tags = c.get("tech_stack") or c.get("expertise") or ""
        prompt += f"Index: {i} | ID: {c_id} | Name: {name} | Difficulty: {difficulty} | Tags: {tags} | Description: {desc}\n"

    prompt += (
        f"\nEvaluate each candidate. Determine if they are relevant to the user query. "
        f"Return a JSON object containing a list of matched items under the key 'matches'. "
        f"Each match must have 'index' (the Index number of the candidate), 'score' (relevance score from 1 to 100), and 'reason' (a brief explanation why it matches).\n"
        f"Return ONLY the JSON. Do not include markdown code block formats.\n"
        f"Example Response format:\n"
        f"{{\n"
        f"  \"matches\": [\n"
        f"    {{\"index\": 0, \"score\": 85, \"reason\": \"Matches Python backend keyword\"}}\n"
        f"  ]\n"
        f"}}"
    )

    try:
        result = await call_llm_json(prompt=prompt)
        matches = result.get("matches", [])
        
        matched_candidates = []
        for m in matches:
            idx = m.get("index")
            if idx is not None and 0 <= idx < len(candidates):
                candidate = dict(candidates[idx])
                candidate["relevance_score"] = m.get("score", 50)
                candidate["relevance_reason"] = m.get("reason", "")
                matched_candidates.append(candidate)
                
        # Sort matches by score descending
        matched_candidates.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return matched_candidates
    except Exception as e:
        logger.error(f"Search Filtering Agent failed: {e}")
        return candidates
