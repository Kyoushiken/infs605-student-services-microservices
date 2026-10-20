# -------------------------------------------------------------------
# Dockerfile for the feedback microservice
# Purpose: Build a small Python image that runs the Flask app (app.py).
#
# Notes:
# - This image uses python:3.11-slim (Debian-slim base) to keep it small.
# - Unlike student-profile, there is no wait-for-it.sh script here.
#   app.py retries the database connection itself (20 tries, 2 seconds
#   apart), so the container does not need netcat or a wait script.
# - We copy requirements first to leverage Docker layer caching:
#   if only application code changes, pip install will be reused.
# -------------------------------------------------------------------

# Use the official Python slim image as the base.
FROM python:3.11-slim

# Set the working directory inside the container. All subsequent
# commands (COPY, RUN, CMD...) are relative to /app.
WORKDIR /app

# Copy the Python dependency manifest first.
# Why first? Docker caches layers: if requirements.txt has not changed,
# the next build will reuse this layer and skip re-installing packages.
COPY requirements.txt .

# Install Python dependencies using pip. --no-cache-dir keeps pip from
# caching wheels inside the image (saves space).
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source code into the image.
COPY . .

# Document the port the Flask app listens on (see app.run in app.py).
# This does not publish the port; the ports: line in docker-compose.yml does.
EXPOSE 5004

# Command to run when the container starts.
# - We use the exec-form (JSON array) so the process receives signals directly.
CMD ["python", "app.py"]