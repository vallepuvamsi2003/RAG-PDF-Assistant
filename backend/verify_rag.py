import os
import shutil
import sys

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

import fitz  # PyMuPDF
from document_processor import process_pdf
from rag_chain import query_pdf

def create_dummy_pdf(pdf_path):
    print(f"Creating dummy PDF at {pdf_path}...")
    doc = fitz.open()
    page = doc.new_page()
    
    text_content = (
        "RAG PDF Assistant Verification Document\n\n"
        "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines "
        "that are programmed to think like humans and mimic their actions. The term may also be "
        "applied to any machine that exhibits traits associated with a human mind such as learning "
        "and problem-solving.\n\n"
        "The Retrieval-Augmented Generation (RAG) architecture combines information retrieval with "
        "a generative language model to improve response quality. It retrieves relevant documents "
        "or snippets from a local vector database and passes them to the LLM as context alongside "
        "the user's question. This minimizes hallucinations and ensures answers are grounded in "
        "source materials.\n\n"
        "This system is successfully configured and running. The vector database used is FAISS, and "
        "the embedding model is a Sentence Transformer. The generative model is Google's Gemini 1.5 Flash."
    )
    
    # Write text onto page
    page.insert_text((50, 50), text_content, fontsize=11)
    doc.save(pdf_path)
    doc.close()
    print("Dummy PDF created.")

def main():
    pdf_path = "dummy_test.pdf"
    vector_dir = "dummy_faiss"
    
    # 1. Create dummy pdf
    create_dummy_pdf(pdf_path)
    
    try:
        # 2. Run document processing pipeline
        print("\n--- Running pipeline processing ---")
        num_chunks = process_pdf(pdf_path, vector_dir)
        print(f"Success! Processed PDF into {num_chunks} chunks.")
        
        # 3. Test query_pdf
        print("\n--- Querying vector database ---")
        question = "What is RAG and how does it work?"
        result = query_pdf(vector_dir, question)
        
        print("\n--- Result ---")
        if "error" in result:
            print(f"Error querying: {result['error']}")
            sys.exit(1)
        else:
            print(f"Answer: {result['answer']}")
            print("\nReferences:")
            for ref in result['references']:
                print(f"- [Source {ref['source_id']} - Page {ref['page']}]: {ref['text'][:100]}...")
            
            print("\nSUCCESS: All pipeline components are functioning correctly!")
            
    except Exception as e:
        print(f"\nERROR: Verification failed: {e}")
        sys.exit(1)
    finally:
        # Cleanup files
        print("\nCleaning up verification files...")
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
        if os.path.exists(vector_dir):
            shutil.rmtree(vector_dir)
        print("Cleanup done.")

if __name__ == "__main__":
    main()
