FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the backend requirements
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY backend/ /app/backend/

# Expose port 7860 (required by HuggingFace Spaces)
EXPOSE 7860

# Command to run the application on port 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
