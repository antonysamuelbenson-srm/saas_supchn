import os

# LLM Settings
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # "gemini", "groq"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

DATABASE_URL = os.getenv("DATABASE_URL")
