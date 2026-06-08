"""AI-powered mentor matching engine.

Ranks available mentors against a student's skills and career goal.
"""

from __future__ import annotations

import logging
from typing import Any
from app.ai.llm import call_llm_json, get_api_keys

logger = logging.getLogger(__name__)

async def match_mentors(
    student_skills: list[dict[str, Any]],
    career_goal: str | None,
    available_mentors: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Match a student with the best available mentors using an AI agent."""
    gemini_key, openai_key = get_api_keys()

    if gemini_key or openai_key:
        try:
            logger.info("Using real AI Mentor Matching Agent...")
            prompt = (
                f"You are an AI Mentor Matching and Connection Agent.\n"
                f"Your task is to rank the available mentors based on a student's skills and career goal.\n"
                f"Student Skills: {student_skills}\n"
                f"Student Career Goal: \"{career_goal}\"\n\n"
                f"Available Mentors:\n"
            )
            for m in available_mentors:
                prompt += f"- ID: {m['id']} | Name: {m['name']} | Expertise: {m['expertise']} | Rating: {m['rating']} | Hourly Rate: ${m['hourly_rate']}\n"
            
            prompt += (
                f"\nEvaluate and rank each mentor from best to worst fit. "
                f"Return a JSON object containing a list of matched mentors under the key 'matches'. "
                f"Each entry must contain 'mentor_id' (integer), 'match_score' (a float percentage between 0 and 100), "
                f"and 'reasoning' (a brief professional explanation of why they fit or how they can help with the career goal).\n"
                f"Return ONLY the raw JSON object matching this schema:\n"
                f"{{\n"
                f"  \"matches\": [\n"
                f"    {{\"mentor_id\": 1, \"match_score\": 92.5, \"reasoning\": \"Detailed professional reason here.\"}}\n"
                f"  ]\n"
                f"}}"
            )
            
            result = await call_llm_json(prompt=prompt)
            if "matches" in result:
                return result["matches"]
        except Exception as e:
            logger.error(f"Real AI Mentor Matching failed: {e}. Falling back to simulation.")

    # Fallback/Simulation if API key is not available
    logger.info("Using simulated AI mentor matching agent...")
    student_skill_names = {s.get("skill_name", "").lower() for s in student_skills}
    goal_lower = (career_goal or "").lower()

    results: list[dict[str, Any]] = []

    for mentor in available_mentors:
        mentor_id = mentor.get("id", 0)
        mentor_name = mentor.get("name", "Mentor")
        expertise: list[str] = mentor.get("expertise", [])
        rating: float = mentor.get("rating", 0.0)
        hourly_rate: float = mentor.get("hourly_rate", 0.0)

        expertise_lower = [e.lower() for e in expertise]

        # Overlap score
        overlap = len(student_skill_names & set(expertise_lower))
        overlap_score = min(40.0, overlap * 10.0)

        # Rating bonus
        rating_score = rating * 6.0

        # Goal relevance
        goal_score = 0.0
        if goal_lower:
            for exp in expertise_lower:
                if exp in goal_lower or goal_lower in exp:
                    goal_score = 20.0
                    break
            if goal_score == 0.0:
                goal_words = set(goal_lower.split())
                exp_words = {w for e in expertise_lower for w in e.split()}
                common = goal_words & exp_words
                goal_score = min(15.0, len(common) * 5.0)

        # Value score
        if hourly_rate <= 50:
            value_score = 10.0
        elif hourly_rate <= 100:
            value_score = 7.0
        elif hourly_rate <= 150:
            value_score = 4.0
        else:
            value_score = 2.0

        total_score = round(min(100.0, overlap_score + rating_score + goal_score + value_score), 1)

        reasoning_parts: list[str] = []
        if overlap > 0:
            reasoning_parts.append(
                f"{mentor_name} has expertise in {overlap} of your current skill areas"
            )
        if goal_score > 10:
            reasoning_parts.append(
                f"their experience aligns well with your goal of '{career_goal}'"
            )
        if rating >= 4.5:
            reasoning_parts.append(f"highly rated ({rating}/5.0) by previous students")
        elif rating >= 4.0:
            reasoning_parts.append(f"well-rated ({rating}/5.0) by previous students")

        if not reasoning_parts:
            reasoning_parts.append(
                f"{mentor_name} brings diverse expertise in {', '.join(expertise[:3])}"
            )

        reasoning = ". ".join(reasoning_parts).capitalize() + "."

        results.append({
            "mentor_id": mentor_id,
            "match_score": total_score,
            "reasoning": reasoning,
        })

    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results
