from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import csv
from io import StringIO

app = Flask(__name__)
CORS(app)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'csv_file' not in request.files:
        return 'No file part', 400
    else:
        file = request.files['csv_file']
        print("File recieved", file.filename)

        content = file.read().decode('windows-1252')
        print("File Content Preview")
        print(content[:100])    

        # Convert string to file-like object
        csv_file = StringIO(content)
        reader = csv.reader(csv_file)

        data = [row for row in reader]
        print("Parsed CSV Data (first 5 rows):")
        for row in data[:5]:
            print(row)

        return jsonify({
        "message": "File received successfully",
        "filename": file.filename,
        "rows": data[:5]  # Send first 5 rows to frontend (optional)
        }), 200


@app.route('/upload_api', methods=['POST'])
def upload_api():
    data = request.get_json()
    text_info = data.get('textInfo')
    print(text_info)

    return text_info

@app.route('/fetch-api-dataset', methods=['GET'])
def upload_data_from_api():
    api_url = upload_api()
    try:
        response = requests.get(api_url)
        response.raise_for_status() #Raise error if status is not 200

        data = response.json()

        return jsonify({
            "status": "success",
            "data": data
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    
    
if __name__ == "__main__":
    app.run(debug=True)