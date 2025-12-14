# from app import db

# class FakeSupabase:
#     def table(self, table_name):
#         return FakeTable(table_name)

# class FakeTable:
#     def __init__(self, table_name):
#         self.table_name = table_name
#         self.query = db.session.query
#         self.filters = []

#     def select(self, *args):
#         self.columns = args
#         return self

#     def eq(self, key, value):
#         self.filters.append((key, value))
#         return self

#     def execute(self):
#         # Build SQLAlchemy query dynamically
#         sql = f"SELECT * FROM {self.table_name}"
#         if self.filters:
#             conditions = " AND ".join([f"{k}='{v}'" for k, v in self.filters])
#             sql += f" WHERE {conditions}"
#         result = db.session.execute(sql)
#         rows = [dict(r._mapping) for r in result]
#         return type("Res", (), {"data": rows})

# # Create a single instance to use everywhere
# supabase = FakeSupabase()



from sqlalchemy import text  # ✅ 1. Import this
from app import db

class FakeSupabase:
    def table(self, table_name):
        return FakeTable(table_name)

class FakeTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self.query = db.session.query
        self.filters = []

    def select(self, *args):
        self.columns = args
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def execute(self):
        # Build SQLAlchemy query dynamically
        sql = f"SELECT * FROM {self.table_name}"
        
        if self.filters:
            # Note: This is vulnerable to SQL injection if inputs aren't sanitized.
            # However, this matches your current logic.
            conditions = " AND ".join([f"{k}='{v}'" for k, v in self.filters])
            sql += f" WHERE {conditions}"
            
        # ✅ 2. FIX: Wrap the SQL string in text()
        result = db.session.execute(text(sql))
        
        rows = [dict(r._mapping) for r in result]
        return type("Res", (), {"data": rows})

# Create a single instance to use everywhere
supabase = FakeSupabase()