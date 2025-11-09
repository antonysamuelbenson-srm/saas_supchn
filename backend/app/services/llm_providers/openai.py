from openai import OpenAI
from app.config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def call_llm(prompt: str):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=400
        )

        text = None
        # Extract content safely
        if response and response.choices:
            choice = response.choices[0]
            if hasattr(choice, "message") and choice.message and "content" in choice.message:
                text = choice.message["content"]

        if not text:
            text = "SELECT 1;"
]
        sql = text.split(';')[0].strip()
        if not sql.endswith(';'):
            sql += ';'

        # Token usage
        input_tokens = getattr(response.usage, "total_tokens", 0)
        output_tokens = getattr(response.usage, "completion_tokens", 0)

        return sql, input_tokens, output_tokens

    except Exception as e:
        raise RuntimeError(f"OpenAI API error: {str(e)}")
