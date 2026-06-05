"""AI-powered mentor matching engine (MOCK – Phase 3).

Ranks available mentors against a student's skills and career goal.
"""

from __future__ import annotations

from typing import Any


async def match_mentors(
    student_skills: list[dict[str, Any]],
    career_goal: str | None,
    available_mentors: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Match a student with the best available mentors.

    This is a **mock** implementation that produces deterministic rankings
    based on simple heuristic overlap between student needs and mentor
    expertise, without calling any external AI service.

    Args:
        student_skills: List of dicts with 'skill_name' and 'proficiency_level'.
        career_goal: Free-text career goal, e.g. "Become a Senior Backend Engineer".
        available_mentors: List of mentor dicts with 'id', 'name', 'expertise'
                          (list of strings), 'rating', 'hourly_rate'.

    Returns:
        List of dicts sorted by match_score descending, each containing:
        - mentor_id, match_score (0-100), reasoning (str).
    """
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

        # Overlap score: how many student skills the mentor can teach
        overlap = len(student_skill_names & set(expertise_lower))
        overlap_score = min(40.0, overlap * 10.0)

        # Rating bonus (0-30)
        rating_score = rating * 6.0  # max 5 * 6 = 30

        # Goal relevance (0-20)
        goal_score = 0.0
        if goal_lower:
            for exp in expertise_lower:
                if exp in goal_lower or goal_lower in exp:
                    goal_score = 20.0
                    break
            if goal_score == 0.0:
                # Partial match
                goal_words = set(goal_lower.split())
                exp_words = {w for e in expertise_lower for w in e.split()}
                common = goal_words & exp_words
                goal_score = min(15.0, len(common) * 5.0)

        # Value score: slight preference for reasonably priced mentors (0-10)
        if hourly_rate <= 50:
            value_score = 10.0
        elif hourly_rate <= 100:
            value_score = 7.0
        elif hourly_rate <= 150:
            value_score = 4.0
        else:
            value_score = 2.0

        total_score = round(min(100.0, overlap_score + rating_score + goal_score + value_score), 1)

        # Generate reasoning
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
