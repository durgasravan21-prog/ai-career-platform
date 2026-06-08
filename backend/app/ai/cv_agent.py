import logging
from typing import List, Dict, Any, Optional
from app.ai.llm import call_llm_json, get_api_keys

logger = logging.getLogger(__name__)

async def analyze_cv_ai(
    cv_text: str,
    target_role_title: str,
    required_skills: List[str]
) -> Optional[Dict[str, Any]]:
    """
    Scans and parses CV text using LLM against target role requirements.
    
    Args:
        cv_text: Plain text extracted from resume file.
        target_role_title: Name of target career role.
        required_skills: List of required skills to check.
        
    Returns:
        Dict matching CVAnalysisResponse fields or None if no keys/failed.
    """
    gemini_key, openai_key = get_api_keys()
    if not (gemini_key or openai_key):
        logger.info("No API keys for CV Scanning Agent. Using heuristic fallback.")
        return None

    try:
        logger.info("Using real AI CV Scanning Agent to parse resume...")
        prompt = (
            f"You are an AI ATS (Applicant Tracking System) Resume Scanner and Career Agent.\n"
            f"Your task is to analyze the following resume plain text against the target role: \"{target_role_title}\".\n"
            f"Required Skills List: {required_skills}\n\n"
            f"Resume Text:\n{cv_text}\n\n"
            f"Perform a comprehensive analysis:\n"
            f"1. Score the resume from 20 to 100 on ATS compatibility (ATS Score).\n"
            f"2. Identify missing technical keywords/skills from the Required Skills List.\n"
            f"3. Detect layout, parsing, or formatting issues (e.g., missing contact details, extreme length, missing sections like projects/summary).\n"
            f"4. Highlight rejection risks (e.g. no contact info, missing critical experience for target role).\n"
            f"5. Provide 3-5 highly actionable recommendations for improvement.\n"
            f"6. Parse skills, education (degree and institution), and experience (job title and roles).\n\n"
            f"Return ONLY a JSON object matching this schema:\n"
            f"{{\n"
            f"  \"ats_score\": 78,\n"
            f"  \"target_role\": \"{target_role_title}\",\n"
            f"  \"missing_keywords\": [\"Docker\", \"Kubernetes\"],\n"
            f"  \"formatting_issues\": [\"No GitHub link\", \"Resume is over 3 pages long\"],\n"
            f"  \"rejection_risks\": [\"Missing professional summary\"],\n"
            f"  \"actionable_recommendations\": [\"Add a 3-line summary at the top\", \"Include GitHub links\"],\n"
            f"  \"parsed_skills\": [\"React\", \"TypeScript\", \"Node.js\"],\n"
            f"  \"parsed_education\": [\"B.S. in Computer Science from Stanford University\"],\n"
            f"  \"parsed_experience\": [\"Full-Stack Engineer at Google\", \"Frontend Developer Intern at Stripe\"]\n"
            f"}}"
        )

        result = await call_llm_json(prompt=prompt)
        if "ats_score" in result:
            return result
    except Exception as e:
        logger.error(f"AI CV Scanning Agent failed: {e}")
        
    return None
