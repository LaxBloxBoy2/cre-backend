import os
import json
import requests
from fastapi import HTTPException
from ..schemas.lease_schema import LeaseAnalysisRequest, LeaseAnalysisResponse

async def analyze_lease(request: LeaseAnalysisRequest) -> LeaseAnalysisResponse:
    """
    Analyze a commercial lease using DeepSeek model via Fireworks API

    Args:
        request: The lease analysis request containing the lease text

    Returns:
        Lease analysis response with extracted information

    Raises:
        HTTPException: If there's an error with the API request
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        # Generate lease analysis
        if use_fallback:
            analysis = _get_fallback_lease_analysis(request.lease_text)
        else:
            try:
                analysis = await _generate_ai_lease_analysis(request.lease_text)
            except Exception as e:
                print(f"Error calling Fireworks API: {str(e)}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                analysis = _get_fallback_lease_analysis(request.lease_text)

        # Create and return the response
        return LeaseAnalysisResponse(
            base_rent=analysis["base_rent"],
            lease_term=analysis["lease_term"],
            renewals=analysis["renewals"],
            break_clauses=analysis["break_clauses"],
            red_flags=analysis["red_flags"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing lease: {str(e)}")


async def _generate_ai_lease_analysis(lease_text: str) -> dict:
    """
    Generate a lease analysis using DeepSeek model via Fireworks API

    Args:
        lease_text: The lease text to analyze

    Returns:
        Dictionary with extracted lease information

    Raises:
        requests.RequestException: If there's an error with the API request
    """
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")

    # Create a prompt for the lease analysis
    prompt = _create_lease_analysis_prompt(lease_text)

    # Send the prompt to DeepSeek model via Fireworks API
    headers = {
        "Authorization": f"Bearer {fireworks_api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "accounts/fireworks/models/deepseek-coder-6.7b",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert commercial real estate attorney specializing in lease analysis. Your task is to extract key information from commercial leases and identify potential issues."
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.3,
        "response_format": {"type": "json_object"}
    }

    response = requests.post(
        "https://api.fireworks.ai/inference/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=60
    )

    # Check if the request was successful
    response.raise_for_status()

    # Extract the assistant's response
    response_json = response.json()
    analysis_text = response_json["choices"][0]["message"]["content"]

    # Parse the response to extract lease information
    try:
        # Try to parse as JSON
        analysis_data = json.loads(analysis_text)

        # Ensure all required fields are present
        return {
            "base_rent": analysis_data.get("base_rent", "Not specified"),
            "lease_term": analysis_data.get("lease_term", "Not specified"),
            "escalations": analysis_data.get("escalations", "Not specified"),
            "tenant_name": analysis_data.get("tenant_name", "Not specified"),
            "renewals": analysis_data.get("renewals", []),
            "break_clauses": analysis_data.get("break_clauses", []),
            "red_flags": analysis_data.get("red_flags", []),
            "summary": analysis_data.get("summary", "Not specified")
        }
    except json.JSONDecodeError:
        # If not valid JSON, try to extract information from text
        return _extract_lease_info_from_text(analysis_text)


def _create_lease_analysis_prompt(lease_text: str) -> str:
    """
    Create a prompt for the lease analysis

    Args:
        lease_text: The lease text to analyze

    Returns:
        Prompt for the AI model
    """
    prompt = f"""Analyze the following commercial lease. Extract:
- Base rent
- Lease term
- Escalations (annual rent increases)
- Tenant name
- Renewal options
- Break clauses
- Red flag clauses
- Summary (a concise 1-2 sentence summary of the key lease terms)

Lease Text:
```
{lease_text}
```

Please respond with a JSON object in the following format:
{{
  "base_rent": "The base rent amount and frequency",
  "lease_term": "The duration of the lease",
  "escalations": "The annual rent increases",
  "tenant_name": "The name of the tenant",
  "renewals": [
    "Renewal option 1",
    "Renewal option 2"
  ],
  "break_clauses": [
    "Break clause 1",
    "Break clause 2"
  ],
  "red_flags": [
    "Red flag 1",
    "Red flag 2"
  ],
  "summary": "A concise 1-2 sentence summary of the key lease terms"
}}

If any information is not found in the lease, use "Not specified" for string fields and empty arrays for list fields.
"""

    return prompt


def _extract_lease_info_from_text(analysis_text: str) -> dict:
    """
    Extract lease information from text when JSON parsing fails

    Args:
        analysis_text: The analysis text from the AI model

    Returns:
        Dictionary with extracted lease information
    """
    # Initialize with default values
    lease_info = {
        "base_rent": "Not specified",
        "lease_term": "Not specified",
        "escalations": "Not specified",
        "tenant_name": "Not specified",
        "renewals": [],
        "break_clauses": [],
        "red_flags": [],
        "summary": "Not specified"
    }

    # Extract base rent
    if "base rent" in analysis_text.lower():
        for line in analysis_text.split("\n"):
            if "base rent" in line.lower():
                parts = line.split(":", 1)
                if len(parts) > 1:
                    lease_info["base_rent"] = parts[1].strip()
                    break

    # Extract lease term
    if "lease term" in analysis_text.lower():
        for line in analysis_text.split("\n"):
            if "lease term" in line.lower():
                parts = line.split(":", 1)
                if len(parts) > 1:
                    lease_info["lease_term"] = parts[1].strip()
                    break

    # Extract escalations
    if "escalation" in analysis_text.lower():
        for line in analysis_text.split("\n"):
            if "escalation" in line.lower():
                parts = line.split(":", 1)
                if len(parts) > 1:
                    lease_info["escalations"] = parts[1].strip()
                    break

    # Extract tenant name
    if "tenant" in analysis_text.lower() or "lessee" in analysis_text.lower():
        for line in analysis_text.split("\n"):
            if "tenant name" in line.lower() or "lessee name" in line.lower():
                parts = line.split(":", 1)
                if len(parts) > 1:
                    lease_info["tenant_name"] = parts[1].strip()
                    break

    # Extract renewals
    if "renewal" in analysis_text.lower():
        in_renewals_section = False
        for line in analysis_text.split("\n"):
            if "renewal" in line.lower() and ":" in line:
                in_renewals_section = True
                continue
            elif in_renewals_section and line.strip() and line.strip()[0] in ["-", "*", "•"]:
                lease_info["renewals"].append(line.strip().lstrip("-*• ").strip())
            elif in_renewals_section and line.strip() and any(section in line.lower() for section in ["break clause", "red flag"]):
                in_renewals_section = False

    # Extract break clauses
    if "break clause" in analysis_text.lower():
        in_break_section = False
        for line in analysis_text.split("\n"):
            if "break clause" in line.lower() and ":" in line:
                in_break_section = True
                continue
            elif in_break_section and line.strip() and line.strip()[0] in ["-", "*", "•"]:
                lease_info["break_clauses"].append(line.strip().lstrip("-*• ").strip())
            elif in_break_section and line.strip() and "red flag" in line.lower():
                in_break_section = False

    # Extract red flags
    if "red flag" in analysis_text.lower():
        in_red_flags_section = False
        for line in analysis_text.split("\n"):
            if "red flag" in line.lower() and ":" in line:
                in_red_flags_section = True
                continue
            elif in_red_flags_section and line.strip() and line.strip()[0] in ["-", "*", "•"]:
                lease_info["red_flags"].append(line.strip().lstrip("-*• ").strip())

    # Extract summary
    if "summary" in analysis_text.lower():
        for line in analysis_text.split("\n"):
            if "summary" in line.lower():
                parts = line.split(":", 1)
                if len(parts) > 1:
                    lease_info["summary"] = parts[1].strip()
                    break

    # If no summary was found, generate one
    if lease_info["summary"] == "Not specified":
        if lease_info["base_rent"] != "Not specified" and lease_info["lease_term"] != "Not specified":
            lease_info["summary"] = f"Commercial lease with base rent of {lease_info['base_rent']} for a term of {lease_info['lease_term']}."
        else:
            lease_info["summary"] = "Commercial lease agreement with limited details extracted."

    return lease_info


def _get_fallback_lease_analysis(lease_text: str) -> dict:
    """
    Provide a fallback response for lease analysis

    Args:
        lease_text: The lease text to analyze

    Returns:
        Dictionary with extracted lease information
    """
    # Simple text analysis to extract basic information
    lease_text_lower = lease_text.lower()

    # Extract base rent (look for dollar amounts near "rent" mentions)
    base_rent = "Not specified"
    rent_indicators = ["base rent", "monthly rent", "annual rent", "rent shall be"]
    for indicator in rent_indicators:
        if indicator in lease_text_lower:
            # Find the indicator in the text
            pos = lease_text_lower.find(indicator)
            # Look for a dollar amount in the next 100 characters
            snippet = lease_text[pos:pos+100]
            # Simple regex-like search for dollar amounts
            dollar_pos = snippet.find("$")
            if dollar_pos != -1:
                # Extract the amount (up to 20 chars after $ sign)
                amount = snippet[dollar_pos:dollar_pos+20]
                # Truncate at the first non-amount character
                for i, char in enumerate(amount):
                    if i > 0 and not (char.isdigit() or char in ",."):
                        amount = amount[:i]
                        break
                base_rent = amount
                break

    # Extract lease term (look for years or months near "term" mentions)
    lease_term = "Not specified"
    term_indicators = ["lease term", "term of lease", "term shall be"]
    for indicator in term_indicators:
        if indicator in lease_text_lower:
            # Find the indicator in the text
            pos = lease_text_lower.find(indicator)
            # Look for year/month mentions in the next 100 characters
            snippet = lease_text_lower[pos:pos+100]
            # Check for common term patterns
            for pattern in ["year", "month", "annual"]:
                if pattern in snippet:
                    # Extract a reasonable snippet
                    start = max(0, snippet.find(pattern) - 10)
                    end = min(len(snippet), snippet.find(pattern) + 20)
                    term_snippet = lease_text[pos + start:pos + end]
                    lease_term = term_snippet.strip()
                    break
            if lease_term != "Not specified":
                break

    # Extract escalations (look for percentage increases near "escalation" or "increase" mentions)
    escalations = "Not specified"
    escalation_indicators = ["escalation", "increase", "adjustment"]
    for indicator in escalation_indicators:
        if indicator in lease_text_lower:
            # Find the indicator in the text
            pos = lease_text_lower.find(indicator)
            # Look for a percentage in the next 100 characters
            snippet = lease_text[pos:pos+100]
            # Simple search for percentages
            if "%" in snippet:
                # Extract a reasonable snippet
                pct_pos = snippet.find("%")
                start = max(0, pct_pos - 10)
                end = min(len(snippet), pct_pos + 10)
                escalations = snippet[start:end].strip()
                break

    # Extract tenant name
    tenant_name = "Not specified"
    tenant_indicators = ["tenant:", "tenant name", "lessee:", "lessee name"]
    for indicator in tenant_indicators:
        if indicator in lease_text_lower:
            # Find the indicator in the text
            pos = lease_text_lower.find(indicator)
            # Extract the next few words
            end_pos = lease_text_lower.find(".", pos)
            if end_pos == -1:
                end_pos = min(pos + 50, len(lease_text_lower))
            tenant_snippet = lease_text[pos:end_pos].strip()
            tenant_name = tenant_snippet
            break

    # Generate some plausible renewals based on common patterns
    renewals = []
    if "renew" in lease_text_lower or "extension" in lease_text_lower:
        if "option to extend" in lease_text_lower or "option to renew" in lease_text_lower:
            renewals.append("Tenant has option to renew/extend (details not fully extracted)")

    # Generate some plausible break clauses based on common patterns
    break_clauses = []
    if "terminat" in lease_text_lower:
        break_clauses.append("Lease may contain termination provisions (details not fully extracted)")

    # Generate some plausible red flags based on common issues
    red_flags = []
    red_flag_indicators = {
        "indemnif": "Broad indemnification clause may create excessive liability",
        "as is": "Property accepted 'as is' which may hide defects",
        "waive": "Waiver of rights may be problematic",
        "sole discret": "Landlord has sole discretion on certain matters",
        "default": "Default provisions may be strict",
        "assign": "Assignment restrictions may limit flexibility"
    }

    for indicator, flag in red_flag_indicators.items():
        if indicator in lease_text_lower:
            red_flags.append(flag)

    # Limit to 3 red flags
    red_flags = red_flags[:3]

    # Generate a summary
    summary = "Commercial lease agreement with limited details extracted."
    if base_rent != "Not specified" and lease_term != "Not specified":
        summary = f"Commercial lease with base rent of {base_rent} for a term of {lease_term}."

    return {
        "base_rent": base_rent,
        "lease_term": lease_term,
        "escalations": escalations,
        "tenant_name": tenant_name,
        "renewals": renewals,
        "break_clauses": break_clauses,
        "red_flags": red_flags,
        "summary": summary
    }
