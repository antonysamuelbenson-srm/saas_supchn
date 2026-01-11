import google.generativeai as genai
from app.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

def call_llm(prompt: str):
    model = genai.GenerativeModel("models/gemini-pro-latest")

    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0, "max_output_tokens": 400}
    )

    text = response.text.strip()
    final_sql = text.split(';')[0] + ';'

    # Gemini doesn't expose token usage easily; return 0 placeholders
    input_tokens = 0
    output_tokens = 0

    return final_sql, input_tokens, output_tokens


# import google.generativeai as genai
# from app.config import GEMINI_API_KEY

# genai.configure(api_key=GEMINI_API_KEY)

# for m in genai.list_models():
#     print(m.name)
