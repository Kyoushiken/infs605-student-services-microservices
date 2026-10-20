from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import time
import logging
import psycopg2

logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s course-catalogue: %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://courseuser:coursepass@course-db:5432/coursesdb"
)

def to_course(r):
    return {
        "id": r[0],
        "code": r[1],
        "title": r[2],
        "credits": r[3]
    }

max_retries = 20
for i in range(max_retries):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected to DB!")
        conn.close()
        break
    except psycopg2.OperationalError:
        # If the connection failed, wait and try again.
        print(f"DB connection failed ({i+1}/{max_retries}), retrying in 2s...")
        time.sleep(2)
else:
    # If we've retried max_retries times, raise an error and stop the service.
    raise Exception(f"Could not connect to the database after {max_retries} retries")

def get_connection():
    """
    Create and return a new psycopg2 database connection.

    Note:
    - Each call returns a *new* connection. Handlers must close connections and cursors.
    - For production, use a connection pool (psycopg2.pool or SQLAlchemy engine).
    """
    return psycopg2.connect(DATABASE_URL)

@app.route("/courses", methods=["GET"])
def list_courses():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, code, title, credits FROM courses ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([to_course(r) for r in rows]), 200

@app.route("/health")
def health():
    try:
        get_connection().close()
        return jsonify({"status": "ok"}), 200
    except psycopg2.Error:
        return jsonify({"status": "error", "message": "Database connection failed"}), 503


@app.route("/courses/<int:course_id>", methods=["GET"])
def get_course(course_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, code, title, credits FROM courses WHERE id = %s", (course_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return jsonify(to_course(row)), 200
    else:
        return jsonify({"error": "Course not found"}), 404

@app.route("/courses", methods=["POST"])
def add_course():
    data = request.get_json() or {}
    if "code" not in data or "title" not in data or "credits" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO courses (code, title, credits) VALUES (%s, %s, %s) RETURNING id",
            (data["code"], data["title"], data["credits"]))
        course_id = cur.fetchone()[0]
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Course code already exists"}), 409
    finally:
        cur.close()
        conn.close()

    log.info("Course created: %s", data["code"])
    return jsonify({
        "id": course_id,
        "code": data["code"],
        "title": data["title"],
        "credits": data["credits"]
    }), 201

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)