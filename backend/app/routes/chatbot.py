from flask import Blueprint, request, jsonify, current_app
from app.services.ai_service import generate_and_execute_sql,log_to_csv

bp = Blueprint('chatbot', __name__)

@bp.route('/chat', methods=['POST'])
def handle_chat_query():
    """
    Endpoint to receive a natural language query and return an NL response.
    """
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    
    data = request.get_json()
    nl_query = data.get('query')
    
    if not nl_query:
        return jsonify({"error": "Missing 'query' field in JSON payload"}), 400

    current_app.logger.info(f"Received NL query: {nl_query}")
    
    try:
        # Generate SQL, execute, and get natural language answer
        answer_text = generate_and_execute_sql(nl_query)
        response_data = {"response": answer_text}
    except Exception as e:
        current_app.logger.error(f"Error processing query: {str(e)}")
        response_data = {"error": f"System error: {str(e)}"}
        return jsonify(response_data), 500

    return jsonify(response_data), 200

@bp.route('/feedback', methods=['POST'])
def handle_feedback():
    """
    Endpoint to receive thumbs up/down feedback for a previous query.
    """
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400

    data = request.get_json()
    user_query = data.get('query')
    feedback = data.get('feedback')  # should be "up" or "down"

    if not user_query or feedback not in ['up', 'down']:
        return jsonify({"error": "Missing or invalid 'query' or 'feedback' field"}), 400

    try:
        # Append feedback to existing log row (simplest: log as new entry)
        log_to_csv(
            user_query=user_query,
            context="N/A",
            sql="N/A",
            input_tokens=0,
            output_tokens=0,
            answer="N/A",
            error="",
            feedback=feedback
        )
        return jsonify({"message": "Feedback received"}), 200
    except Exception as e:
        current_app.logger.error(f"Failed to save feedback: {e}")
        return jsonify({"error": "Failed to record feedback"}), 500
