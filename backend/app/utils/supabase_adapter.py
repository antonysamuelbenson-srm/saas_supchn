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
            conditions = " AND ".join([f"{k}='{v}'" for k, v in self.filters])
            sql += f" WHERE {conditions}"
        result = db.session.execute(sql)
        rows = [dict(r._mapping) for r in result]
        return type("Res", (), {"data": rows})

# Create a single instance to use everywhere
supabase = FakeSupabase()