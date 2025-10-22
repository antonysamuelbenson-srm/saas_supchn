from groq import Groq
from app.config import GROQ_API_KEY

# Initialize Groq client once
_client = Groq(api_key=GROQ_API_KEY)


def call_llm(prompt: str):
    """
    Call Groq's llama-3.1-8b-instant model to generate SQL.
    Returns: (sql: str, input_tokens: int, output_tokens: int)
    """
    try:
        chat_completion = _client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.0,
            max_tokens=400,
            top_p=1,
            stream=False
        )
        text = chat_completion.choices[0].message.content.strip()
        
        if text.startswith("```"):
            parts = text.split("```")
            if len(parts) > 1:
                text = parts[1]
                if text.startswith("sql\n"):
                    text = text[4:]
        text = text.strip()
        
        # Extract first SQL statement
        sql = text.split(';')[0].strip()
        sql = sql + ';' if sql and not sql.endswith(';') else (sql if sql else "SELECT 1;")
        
        # Get token usage
        usage = chat_completion.usage
        input_tokens = getattr(usage, 'prompt_tokens', 0)
        output_tokens = getattr(usage, 'completion_tokens', 0)
        
        return sql, input_tokens, output_tokens
        
    except Exception as e:
        raise RuntimeError(f"Groq API error: {str(e)}")
