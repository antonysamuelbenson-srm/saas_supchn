from groq import Groq
from app.config import GROQ_API_KEY

# Initialize Groq client once
_client = Groq(api_key=GROQ_API_KEY)

def call_llm(prompt: str) -> str:
    """
    Call Groq's Llama-3-8b model to generate SQL.
    Returns a clean SQL statement ending with ';'
    """
    try:
        chat_completion = _client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",  # Fast, free, good for SQL
            temperature=0.0,         # Deterministic output
            max_tokens=400,
            top_p=1,
            stream=False
        )
        text = chat_completion.choices[0].message.content.strip()
        
        # Ensure it's a single SQL statement
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1] if "```" in text[3:] else text[3:]
            if text.startswith("sql\n"):
                text = text[4:]
        text = text.strip()
        
        # Return first statement only, ensure semicolon
        sql = text.split(';')[0].strip()
        return sql + ';' if not sql.endswith(';') else sql
        
    except Exception as e:
        raise RuntimeError(f"Groq API error: {str(e)}")
