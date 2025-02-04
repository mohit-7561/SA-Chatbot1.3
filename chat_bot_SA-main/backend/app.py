from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import difflib
import os
import re

#from huggingface_hub import InferenceClient

# Load environment variables from .env file
#from dotenv import load_dotenv
#load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins

# Hugging Face API Key
#HF_API_KEY = os.getenv('HF_API_KEY') 
#if not HF_API_KEY:
#    raise ValueError("Hugging Face API key is not set!")

# Initialize InferenceClient with Hugging Face API key
#client = InferenceClient(api_key=HF_API_KEY)

# Load responses from the JSON file
with open('responses.json', 'r') as f:
    responses = json.load(f)

# Check if the user message is gibberish 
def is_gibberish(user_message):
    if len(user_message) < 3:
        return True
    if bool(re.match(r'^[^a-zA-Z0-9\s]*$', user_message)):  # Corrected regex with raw string
        return True
    return False

def get_best_match(user_message):
    questions = list(responses.keys())
    closest_match = difflib.get_close_matches(user_message, questions, n=1, cutoff=0.6)
    return closest_match[0] if closest_match else None

def get_bot_response(user_message):
    user_message = user_message.lower()
    if user_message in responses:
        return responses[user_message]
    for key in responses:
        if key in user_message:
            return responses[key]
    return None

# def get_hugging_face_response(user_message):
#     messages = [
#         {
#             "role": "user",
#             "content": user_message
#         }
#     ]

#     try:
#         # Call the new model for a response
#         completion = client.chat.completions.create(
#             model="HuggingFaceH4/zephyr-7b-alpha", 
#             # deepseek-ai/DeepSeek-R1-Distill-Llama-8B
#             # meta-llama/Llama-3.3-70B-Instruct
#             messages=messages, 
#             max_tokens=500
#         )

#         assistant_response = completion.choices[0].message
#         return assistant_response['content']
    
#     except Exception as e:
#         print("Error from Hugging Face:", e)
#         return f"Error occurred: {str(e)}"
    
@app.route('/')
def home():
    return "Backend is running!"


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Check for gibberish and return default response if it's gibberish
        if is_gibberish(user_message):
            return jsonify({'response': responses.get('default', 'Sorry, I didn\'t understand that.')})

        # Limit the character length of the user's message 
        if len(user_message) > 200:
            user_message = user_message[:200]  # truncate the message

        fixed_message = get_best_match(user_message)

        if fixed_message:
            response = get_bot_response(fixed_message)
        else:
            response = get_bot_response(user_message)

        # if not response:
        #     response = get_hugging_face_response(user_message)

        if len(response) > 250:
            response = response[:250]

        return jsonify({'response': response})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000)) 
    app.run(host="0.0.0.0", port=port)

