from app.config import LLM_PROVIDER

if LLM_PROVIDER == "gemini":
    from .gemini import call_llm
elif LLM_PROVIDER == "groq":
    from .groq import call_llm
else:
    raise ValueError(f"Unsupported LLM: {LLM_PROVIDER}")
