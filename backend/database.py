import sqlite3
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from config import DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create Documents table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            vector_store_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

def register_user(name, email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    password_hash = generate_password_hash(password)
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return {"id": user_id, "name": name, "email": email}
    except sqlite3.IntegrityError:
        conn.close()
        return None  # Email already exists

def authenticate_user(email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        return {"id": user['id'], "name": user['name'], "email": user['email']}
    return None

def add_document(doc_id, user_id, filename, file_path, vector_store_path, file_size):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO documents (id, user_id, filename, file_path, vector_store_path, file_size) VALUES (?, ?, ?, ?, ?, ?)",
        (doc_id, user_id, filename, file_path, vector_store_path, file_size)
    )
    conn.commit()
    conn.close()

def get_user_documents(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    docs = []
    for row in rows:
        docs.append({
            "id": row["id"],
            "filename": row["filename"],
            "file_path": row["file_path"],
            "vector_store_path": row["vector_store_path"],
            "file_size": row["file_size"],
            "uploaded_at": row["uploaded_at"]
        })
    return docs

def get_document(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "filename": row["filename"],
            "file_path": row["file_path"],
            "vector_store_path": row["vector_store_path"],
            "file_size": row["file_size"],
            "uploaded_at": row["uploaded_at"]
        }
    return None

def delete_document(doc_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

def get_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "created_at": row["created_at"]
        }
    return None
