from flask import Blueprint, request, jsonify, current_app
from app.services.ai_service import generate_and_execute_sql,log_to_db,update_feedback_in_db

bp = Blueprint('chatbot', __name__)

@bp.route('/chat', methods=['POST'])
def handle_chat_query():
    if not request.is_json:
        return jsonify({"error": "Missing JSON"}), 400

    data = request.get_json()
    nl_query = data.get("query")
    if not nl_query:
        return jsonify({"error": "Missing 'query' field"}), 400

    current_app.logger.info(f"Received NL query: {nl_query}")

    try:
        # AI response with metadata
        result = generate_and_execute_sql(nl_query)

        # Log to DB immediately (feedback is NULL initially)
        log_to_db(
            user_query=nl_query,
            context=result["retrieved_context"],
            sql=result["generated_sql"],
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            answer=result["response"],
            error="",
            feedback=None
        )

        return jsonify({"response": result["response"]}), 200

    except Exception as e:
        current_app.logger.error(f"Error processing query: {e}")
        return jsonify({"error": f"System error: {e}"}), 500


@bp.route('/feedback', methods=['POST'])
def update_feedback():
    """
    Update thumbs up/down feedback for the most recent interaction
    of the given user query.
    """
    if not request.is_json:
        return jsonify({"error": "Missing JSON"}), 400

    data = request.get_json()
    user_query = data.get("query")
    feedback = data.get("feedback")

    if not user_query or feedback not in ["up", "down"]:
        return jsonify({"error": "Invalid input. Feedback must be 'up' or 'down'."}), 400

    try:
        # Update feedback for the latest matching query
        update_feedback_in_db(user_query, feedback)
        return jsonify({"message": "Feedback updated successfully."}), 200

    except Exception as e:
        current_app.logger.error(f"Failed to update feedback: {e}")
        return jsonify({"error": "Failed to update feedback."}), 500
    
