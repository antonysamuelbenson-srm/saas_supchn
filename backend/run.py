from app import create_app

from flask_cors import CORS

app = create_app()
CORS(app, resources={r"/*": {"origins": "*"}})


# 🔍 Print all registered routes
print("📌 Registered Flask routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.methods} -> {rule.rule}")

if __name__ == "__main__":
    app.run(debug=True,port=5000)
