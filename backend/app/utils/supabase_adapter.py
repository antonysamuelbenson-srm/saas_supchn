# # from app import db

# # class FakeSupabase:
# #     def table(self, table_name):
# #         return FakeTable(table_name)

# # class FakeTable:
# #     def __init__(self, table_name):
# #         self.table_name = table_name
# #         self.query = db.session.query
# #         self.filters = []

# #     def select(self, *args):
# #         self.columns = args
# #         return self

# #     def eq(self, key, value):
# #         self.filters.append((key, value))
# #         return self

# #     def execute(self):
# #         # Build SQLAlchemy query dynamically
# #         sql = f"SELECT * FROM {self.table_name}"
# #         if self.filters:
# #             conditions = " AND ".join([f"{k}='{v}'" for k, v in self.filters])
# #             sql += f" WHERE {conditions}"
# #         result = db.session.execute(sql)
# #         rows = [dict(r._mapping) for r in result]
# #         return type("Res", (), {"data": rows})

# # # Create a single instance to use everywhere
# # supabase = FakeSupabase()



# from sqlalchemy import text  # ✅ 1. Import this
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
#             # Note: This is vulnerable to SQL injection if inputs aren't sanitized.
#             # However, this matches your current logic.
#             conditions = " AND ".join([f"{k}='{v}'" for k, v in self.filters])
#             sql += f" WHERE {conditions}"
            
#         # ✅ 2. FIX: Wrap the SQL string in text()
#         result = db.session.execute(text(sql))
        
#         rows = [dict(r._mapping) for r in result]
#         return type("Res", (), {"data": rows})

# # Create a single instance to use everywhere
# supabase = FakeSupabase()

from sqlalchemy import text

class FakeSupabase:
    def table(self, table_name):
        return FakeTable(table_name)

class FakeTable:
    def __init__(self, table_name):
        self.table_name = table_name
        self.filters = []
        self.order_by = []
        self.limit_val = None

    def select(self, *args):
        # We ignore specific columns for this shim and just select *
        return self

    def eq(self, key, value):
        self.filters.append(f"{key} = '{value}'")
        return self

    def gte(self, key, value):
        self.filters.append(f"{key} >= '{value}'")
        return self

    def lte(self, key, value):
        self.filters.append(f"{key} <= '{value}'")
        return self

    def order(self, column, desc=False):
        direction = "DESC" if desc else "ASC"
        self.order_by.append(f"{column} {direction}")
        return self

    def limit(self, count):
        self.limit_val = count
        return self

    def maybe_single(self):
        self.limit_val = 1
        return self

    def execute(self):
        # ✅ FIX: Import db here to prevent Circular Import errors
        from app import db
        
        sql = f"SELECT * FROM {self.table_name}"
        
        if self.filters:
            sql += " WHERE " + " AND ".join(self.filters)
            
        if self.order_by:
            sql += " ORDER BY " + ", ".join(self.order_by)
            
        if self.limit_val:
            sql += f" LIMIT {self.limit_val}"
            
        try:
            # text() is required for safe execution
            result = db.session.execute(text(sql))
            rows = [dict(r._mapping) for r in result]
            return type("Res", (), {"data": rows})
        except Exception as e:
            print(f"⚠️ FakeSupabase Adapter Error on SQL: {sql}")
            print(f"Error details: {e}")
            return type("Res", (), {"data": []})

# Singleton instance
supabase = FakeSupabase()