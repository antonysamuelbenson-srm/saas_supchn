from openai import OpenAI
from app.config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

def call_llm(messages):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )

    msg = response.choices[0].message["content"]

    return {
        "answer": msg,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "provider": "openai"
    }
