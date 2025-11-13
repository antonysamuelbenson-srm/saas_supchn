import os
from dotenv import load_dotenv

load_dotenv()  

# LLM Settings
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # default to groq
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# DB Settings
DATABASE_URL = os.getenv("DATABASE_URL")

SECRET_KEY = os.getenv("SECRET_KEY")

