import logging
from typing import List, Dict, Any, Optional
from app.ai.llm import call_llm_json, get_api_keys

logger = logging.getLogger(__name__)

async def recommend_projects_ai(
    user_skills: List[Dict[str, Any]],
    career_goal: Optional[str],
    projects: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranks projects for a student based on their skills and career goal.
    
    Args:
        user_skills: List of user skill dicts.
        career_goal: Target role or career goal text.
        projects: List of project dicts (id, title, description, tech_stack, difficulty).
        
    Returns:
        List of dicts containing project_id, relevance_score, and reason.
    """
    gemini_key, openai_key = get_api_keys()
    
    if not (gemini_key or openai_key):
        logger.info("No API keys for AI Recommendation Agent. Using heuristic fallback.")
        return []

    try:
        logger.info("Using real AI Recommendation Agent to rank projects...")
        prompt = (
            f"You are an AI Recommendation Agent. Your goal is to rank portfolio projects for a student based on their current skills and career goal.\n"
            f"Student Skills: {user_skills}\n"
            f"Career Goal: \"{career_goal or 'Software Engineer'}\"\n\n"
            f"Available Projects:\n"
        )
        for p in projects:
            prompt += f"- ID: {p['id']} | Title: {p['title']} | Difficulty: {p['difficulty']} | Tech Stack: {p['tech_stack']} | Description: {p['description']}\n"
            
        prompt += (
            f"\nIdentify which projects are best to fill the student's skill gaps and align with their goal. "
            f"Return a JSON object containing a list of recommendations under the key 'recommendations'. "
            f"Each entry must contain 'project_id' (integer), 'relevance_score' (float percentage between 0 and 100), "
            f"and 'reason' (a clear explanation of why this project is recommended and what skills it will help build).\n"
            f"Return ONLY the raw JSON object matching this schema:\n"
            f"{{\n"
            f"  \"recommendations\": [\n"
            f"    {{\"project_id\": 1, \"relevance_score\": 95.0, \"reason\": \"Detailed reason here.\"}}\n"
            f"  ]\n"
            f"}}"
        )
        
        result = await call_llm_json(prompt=prompt)
        if "recommendations" in result:
            return result["recommendations"]
    except Exception as e:
        logger.error(f"AI Recommendation Agent failed: {e}")
        
    return []
