from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s course-catalogue: %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

notifications = []

@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/notify", methods=["POST"])
def notify():
    data = request.get_json() or []
    if "to" not in data or "message" not in data:
        return jsonify({"error": "Invalid request, 'to' and 'message' fields are required"}), 400

    entry = {"id": len(notifications) + 1, "to": data["to"], "message": data["message"]}
    notifications.append(entry)
    log.info("Notification sent to: %s: %s", data["to"], data["message"])
    return jsonify(entry), 201

@app.route("/notifications", methods=["GET"])
def notify_get():
    return jsonify(notifications), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003)