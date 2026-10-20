from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import time
import logging
import requests
import psycopg2

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s feedback: %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://feedbackuser:feedbackpass@feedback-db:5432/feedbackdb"
)
STUDENT_URL = os.getenv("STUDENT_URL", "http://student-profile:5001")
COURSE_URL = os.getenv("COURSE_URL", "http://course-catalogue:5002")
NOTIFY_URL = os.getenv("NOTIFY_URL", "http://notification:5003")

max_retries = 20
for i in range(max_retries):
    try:
        conn = psycopg2.connect(DATABASE_URL).close()
        print("Connected to DB!")
        break
    except psycopg2.OperationalError:
        print(f"DB connection failed ({i+1}/{max_retries}), retrying in 2s...")
        time.sleep(2)
else:
    raise Exception(f"Could not connect to the database after {max_retries} retries")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def to_feedback(r):
    return {"id": r[0], "student_id": r[1], "course_id": r[2],
            "rating": r[3], "comment": r[4], "created_at": r[5].isoformat()}

def lookup(url, label):
    """Call another service. Returns (data, error_response)."""
    try:
        res = requests.get(url, timeout=3)
    except requests.RequestException as e:
        log.error("%s service unreachable: %s", label, e)
        return None, (jsonify({"error": f"{label} service unavailable"}), 503)
    if res.status_code == 404:
        return None, (jsonify({"error": f"{label} not found"}), 404)
    if not res.ok:
        log.error("%s service returned %s", label, res.status_code)
        return None, (jsonify({"error": f"{label} service error"}), 502)
    return res.json(), None


@app.route("/health")
def health():
    try:
        get_connection().close()
        return jsonify({"status": "ok"}), 200
    except psycopg2.Error:
        return jsonify({"status": "error", "message": "Database connection failed"}), 503

@app.route("/feedback", methods=["GET"])
def get_feedback():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, student_id, course_id, rating, comments, created_at "
                "FROM feedback ORDER BY id DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([to_feedback(r) for r in rows]),  200

@app.route("/feedback", methods=["POST"])
def add_feedback():
    data = request.get_json() or {}
    for field in ("student_id", "course_id", "rating", "comment"):
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400
    if data["rating"] not in (1, 2, 3, 4, 5):
        return jsonify({"error": "rating must be a whole number from 1 to 5"}), 400

    # Checking if the student exists
    student, err = lookup(f"{STUDENT_URL}/students/{data['student_id']}", "Student")
    if err:
        return err

    # Checking if the course exists
    course, err = lookup(f"{COURSE_URL}/courses/{data['course_id']}", "Course")
    if err:
        return err

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO feedback (student_id, course_id, rating, comments) "
            "VALUES (%s, %s, %s, %s) RETURNING id, created_at ",
            (data["student_id"], data["course_id"], data["rating"], data["comment"]))
        new_id, created_at = cur.fetchone()
        conn.commit()
    finally:
        cur.close()
        conn.close()
    log.info("Feedback %s saved: student %s, course %s",
             new_id, data["student_id"], data["course_id"])

    notified = True
    try:
        res = requests.post(f"{NOTIFY_URL}/notify", timeout=3, json={
            "to": student["email"],
            "message": f"Thanks {student['name']}, your feedback on "
            f"{course['code']} was received."})
        notified = res.ok
    except requests.RequestException as e:
        log.error("Notification service unreachable: %s", e)
        notified = False

    return jsonify({
        "id": new_id,
        "student_id": data["student_id"],
        "course_id": data["course_id"],
        "rating": data["rating"],
        "comment": data["comment"],
        "created_at": created_at.isoformat(),
        "notification_sent": notified
    }), 201

if __name__ == "__main__":
    app.run(host = "0.0.0.0", port=5004)