import google.generativeai as genai
from app.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

def call_llm(prompt: str) -> str:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0, "max_output_tokens": 400}
    )
    text = response.text.strip()
    # Ensure it's a single SQL statement
    return text.split(';')[0] + ';'
