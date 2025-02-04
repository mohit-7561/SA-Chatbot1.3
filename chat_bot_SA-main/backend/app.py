from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
from difflib import get_close_matches

app = Flask(__name__)
CORS(app)

# Load responses from JSON file
with open('responses.json', 'r') as file:
    responses = json.load(file)

def is_gibberish(text):
    # Simple check for gibberish - you can make this more sophisticated
    words = text.lower().split()
    return len(words) > 0 and all(not word.isalnum() for word in words)

def get_best_match(user_input):
    user_input = user_input.lower()
    matches = get_close_matches(user_input, responses.keys(), n=1, cutoff=0.6)
    return matches[0] if matches else None

def get_bot_response(message):
    message = message.lower()
    return responses.get(message, responses['default'])

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').lower()

        if not user_message:
            return jsonify(responses['default']), 400

        # Check for gibberish
        if is_gibberish(user_message):
            return jsonify(responses['default'])

        # Limit message length
        if len(user_message) > 200:
            user_message = user_message[:200]

        # Get best matching response
        fixed_message = get_best_match(user_message)
        if fixed_message:
            response_data = responses[fixed_message]
        else:
            response_data = responses['default']

        return jsonify(response_data)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify(responses['default']), 500

if __name__ == '__main__':
    app.run(debug=True)

