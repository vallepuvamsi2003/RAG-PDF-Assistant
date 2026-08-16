import os
import uuid
import shutil
from functools import wraps
import datetime
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS
import werkzeug.utils

# Local modules
from config import PORT, FLASK_ENV, UPLOAD_FOLDER, VECTOR_STORE_DIR, JWT_SECRET
import database
from document_processor import process_pdf
from rag_chain import query_pdf

# Initialize Flask and CORS
app = Flask(__name__)
CORS(app)

# Initialize database
database.init_db()

# ==========================================
# AUTHENTICATION DECORATOR & HELPERS
# ==========================================
def create_token(user_id, email, name):
    """
    Generates a JWT token valid for 24 hours.
    """
    payload = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def token_required(f):
    """
    Decorator that checks for a valid Bearer Token in the Authorization header.
    Passes current_user dict as the first argument to the decorated function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401
            
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = {
                "id": data["user_id"],
                "email": data["email"],
                "name": data["name"]
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Authentication session has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token. Please log in again."}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# ==========================================
# AUTH ENDPOINTS
# ==========================================
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ["name", "email", "password"]):
        return jsonify({"error": "Missing required fields (name, email, password)"}), 400
        
    name = data["name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
    user = database.register_user(name, email, password)
    if not user:
        return jsonify({"error": "An account with this email address already exists"}), 400
        
    token = create_token(user["id"], user["email"], user["name"])
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ["email", "password"]):
        return jsonify({"error": "Missing email or password"}), 400
        
    email = data["email"].strip().lower()
    password = data["password"]
    
    user = database.authenticate_user(email, password)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
        
    token = create_token(user["id"], user["email"], user["name"])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user
    }), 200

@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    if not data or "email" not in data:
        return jsonify({"error": "Email is required"}), 400
        
    # Standard reset password mock response
    email = data["email"].strip().lower()
    return jsonify({
        "message": f"If an account is associated with {email}, a recovery email will be sent shortly."
    }), 200

@app.route("/api/auth/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    profile = database.get_user_profile(current_user["id"])
    if not profile:
        return jsonify({"error": "User profile not found"}), 404
    return jsonify(profile), 200

# ==========================================
# DOCUMENTS ENDPOINTS
# ==========================================
@app.route("/api/documents", methods=["GET"])
@token_required
def get_documents(current_user):
    docs = database.get_user_documents(current_user["id"])
    return jsonify(docs), 200

@app.route("/api/upload", methods=["POST"])
@token_required
def upload_document(current_user):
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
        
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF documents are supported"}), 400
        
    doc_id = str(uuid.uuid4())
    safe_filename = werkzeug.utils.secure_filename(file.filename)
    
    # Define user specific storage
    user_upload_dir = os.path.join(UPLOAD_FOLDER, str(current_user["id"]))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    file_path = os.path.join(user_upload_dir, f"{doc_id}_{safe_filename}")
    
    # Save PDF locally
    file.save(file_path)
    file_size = os.path.getsize(file_path)
    
    # Define user/doc specific FAISS store path
    user_vector_dir = os.path.join(VECTOR_STORE_DIR, str(current_user["id"]), doc_id)
    os.makedirs(user_vector_dir, exist_ok=True)
    
    try:
        print(f"Processing PDF file for RAG: {safe_filename}")
        num_chunks = process_pdf(file_path, user_vector_dir)
        
        # Save metadata record in DB
        database.add_document(
            doc_id=doc_id,
            user_id=current_user["id"],
            filename=safe_filename,
            file_path=file_path,
            vector_store_path=user_vector_dir,
            file_size=file_size
        )
        
        return jsonify({
            "id": doc_id,
            "filename": safe_filename,
            "file_size": file_size,
            "chunks": num_chunks,
            "message": "PDF uploaded and processed successfully!"
        }), 201
        
    except Exception as e:
        # Cleanup file and directory on failure
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(user_vector_dir):
            shutil.rmtree(user_vector_dir)
            
        print(f"Error during upload processing: {e}")
        return jsonify({"error": f"Failed to parse and index PDF: {str(e)}"}), 500

@app.route("/api/document/<doc_id>", methods=["DELETE"])
@token_required
def delete_document(current_user, doc_id):
    doc = database.get_document(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
        
    if doc["user_id"] != current_user["id"]:
        return jsonify({"error": "Access unauthorized"}), 403
        
    try:
        # Delete raw PDF file
        if os.path.exists(doc["file_path"]):
            os.remove(doc["file_path"])
            
        # Delete FAISS indexes directory
        if os.path.exists(doc["vector_store_path"]):
            shutil.rmtree(doc["vector_store_path"])
            
        # Delete database record
        database.delete_document(doc_id)
        
        return jsonify({"message": "Document deleted successfully."}), 200
        
    except Exception as e:
        print(f"Error deleting document: {e}")
        return jsonify({"error": f"Failed to delete document: {str(e)}"}), 500

@app.route("/api/document/<doc_id>/download", methods=["GET"])
@token_required
def download_document(current_user, doc_id):
    doc = database.get_document(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
        
    if doc["user_id"] != current_user["id"]:
        return jsonify({"error": "Access unauthorized"}), 403
        
    try:
        from flask import send_file
        return send_file(
            doc["file_path"],
            as_attachment=True,
            download_name=doc["filename"]
        )
    except Exception as e:
        print(f"Error downloading document: {e}")
        return jsonify({"error": "Failed to retrieve the file"}), 500

@app.route("/api/document/<doc_id>/view", methods=["GET"])
@token_required
def view_document(current_user, doc_id):
    doc = database.get_document(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
        
    if doc["user_id"] != current_user["id"]:
        return jsonify({"error": "Access unauthorized"}), 403
        
    try:
        from flask import send_file
        return send_file(
            doc["file_path"],
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Error viewing document: {e}")
        return jsonify({"error": "Failed to open the file"}), 500

# ==========================================
# CHAT / RAG ENDPOINT
# ==========================================
@app.route("/api/chat", methods=["POST"])
@token_required
def chat(current_user):
    data = request.get_json()
    if not data or not all(k in data for k in ["document_id", "question"]):
        return jsonify({"error": "Missing document_id or question"}), 400
        
    doc_id = data["document_id"]
    question = data["question"].strip()
    
    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400
        
    doc = database.get_document(doc_id)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
        
    if doc["user_id"] != current_user["id"]:
        return jsonify({"error": "Access unauthorized"}), 403
        
    # Execute RAG query pipeline
    response = query_pdf(doc["vector_store_path"], question)
    
    if "error" in response:
        return jsonify({"error": response["error"]}), 500
        
    return jsonify(response), 200

# ==========================================
# RUN APPLICATION
# ==========================================
if __name__ == "__main__":
    debug_mode = (FLASK_ENV == "development")
    print(f"Starting Flask server on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=debug_mode)
