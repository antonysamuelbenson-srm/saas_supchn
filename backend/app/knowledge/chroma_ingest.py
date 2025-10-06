import os
from chromadb import PersistentClient
from .metrics import METRICS_FORMULAS
from .schema_narrative import DATABASE_SCHEMA, FULL_SCHEMA_NARRATIVE
import re

def parse_schema_narrative(narrative: str) -> list:
    """Extract table descriptions from FULL_SCHEMA_NARRATIVE."""
    docs = []
    # Split by '-- Table: '
    sections = re.split(r'\n-- Table: ', narrative)
    for section in sections[1:]:  # skip first empty
        lines = section.strip().split('\n')
        table_line = lines[0].strip()
        table_name = table_line.split()[0]  # e.g., "alert"
        
        # Extract description (line starting with '-- DESCRIPTION:')
        desc_lines = []
        for line in lines:
            if line.strip().startswith('-- DESCRIPTION:'):
                desc_lines.append(line.replace('-- DESCRIPTION:', '').strip())
            elif desc_lines and line.strip().startswith('--'):
                # Continue description
                desc_lines.append(line.strip().lstrip('-- ').strip())
            elif desc_lines:
                break  # end of description
        
        if desc_lines:
            content = f"Table '{table_name}': " + " ".join(desc_lines)
            docs.append({
                "id": f"table_{table_name}",
                "text": content,
                "metadata": {"type": "table", "name": table_name}
            })
    return docs

def build_knowledge_documents():
    docs = []

    # Add metrics
    for name, meta in METRICS_FORMULAS.items():
        docs.append({
            "id": f"metric_{name.lower().replace(' ', '_')}",
            "text": f"Metric '{name}': {meta['description']} {meta['sql_template']}",
            "metadata": {"type": "metric", "name": name}
        })

    # Add table narratives
    docs.extend(parse_schema_narrative(FULL_SCHEMA_NARRATIVE))

    # Add critical join rules (hardcoded for clarity)
    docs.append({
        "id": "join_rule_predict",
        "text": "CRITICAL: The 'predict' table uses store_id as VARCHAR that matches store_data.store_code (not store_id). Always join predict.store_id = store_data.store_code.",
        "metadata": {"type": "join_rule", "name": "predict_store_join"}
    })

    docs.append({
        "id": "view_forecast_unified",
        "text": "Use the 'forecast_unified' view for all forecast queries. It combines ML predictions ('ml' source) and user uploads ('user' source) and exposes canonical store_id (BIGINT).",
        "metadata": {"type": "view", "name": "forecast_unified"}
    })

    return docs

def ingest_into_chroma():
    client = PersistentClient(path=os.path.join(os.getcwd(), "chroma_db"))
    collection = client.get_or_create_collection("inventory_docs")

    docs = build_knowledge_documents()
    ids = [d["id"] for d in docs]
    texts = [d["text"] for d in docs]
    metadatas = [d["metadata"] for d in docs]

    collection.upsert(ids=ids, documents=texts, metadatas=metadatas)
    print(f"Ingested {len(docs)} knowledge documents into ChromaDB.")

if __name__ == "__main__":
    ingest_into_chroma()
