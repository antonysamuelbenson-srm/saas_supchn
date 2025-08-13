import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("ANON_KEY")  # ✅ use ANON_KEY instead of SECRET_KEY
    return create_client(url, key)
