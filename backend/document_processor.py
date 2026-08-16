import os
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

def extract_text_from_pdf(pdf_path):
    """
    Extracts text page-by-page from a PDF file.
    Returns a list of dicts: [{'text': page_text, 'page': page_number}, ...]
    """
    print(f"Extracting text from PDF: {pdf_path}")
    doc = fitz.open(pdf_path)
    pages_data = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        pages_data.append({
            "text": text,
            "page": page_num + 1  # Store 1-based page numbers
        })
        
    print(f"Extracted {len(pages_data)} pages.")
    return pages_data

def chunk_text(pages_data, chunk_size=800, chunk_overlap=150):
    """
    Splits the extracted text into overlapping chunks, maintaining page metadata.
    Returns a list of LangChain Document objects.
    """
    print("Chunking text pages...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )
    
    documents = []
    for page in pages_data:
        text = page["text"]
        page_num = page["page"]
        
        # Split text for current page
        chunks = splitter.split_text(text)
        for chunk in chunks:
            if chunk.strip():
                # Store chunk with the source page number in metadata
                documents.append(Document(
                    page_content=chunk,
                    metadata={"page": page_num}
                ))
                
    print(f"Generated {len(documents)} chunks.")
    return documents

def get_embeddings_model():
    """
    Load the SentenceTransformers embedding model.
    Using a standard, lightweight, high-performance CPU model.
    """
    print("Loading HuggingFace Embeddings model (all-MiniLM-L6-v2)...")
    # Using all-MiniLM-L6-v2 locally (CPU-friendly, ~90MB)
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )

def create_vector_store(documents, store_path):
    """
    Generates embeddings and builds a FAISS index from documents.
    Saves index to the specified store_path directory.
    """
    print(f"Creating vector store at: {store_path}")
    embeddings = get_embeddings_model()
    
    # Build FAISS index from documents
    db = FAISS.from_documents(documents, embeddings)
    
    # Save the index locally
    db.save_local(store_path)
    print("Vector store created and saved successfully.")
    return db

def process_pdf(pdf_path, store_path):
    """
    Full pipeline to process a PDF and index it in FAISS.
    """
    pages_data = extract_text_from_pdf(pdf_path)
    
    # Compile all text to check if it's empty
    total_text = "".join([page["text"].strip() for page in pages_data])
    if not total_text:
        raise ValueError(
            "This PDF contains no extractable text. Scanned images, blank pages, or encrypted documents are not supported."
        )
        
    documents = chunk_text(pages_data)
    
    # Fallback to prevent passing an empty list to FAISS.from_documents
    if not documents:
        print("Warning: Chunker generated 0 chunks, creating a single fallback document from page text.")
        documents = [Document(
            page_content=total_text[:1500],
            metadata={"page": 1}
        )]
        
    create_vector_store(documents, store_path)
    return len(documents)
