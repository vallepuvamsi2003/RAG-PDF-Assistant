import os
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from document_processor import get_embeddings_model
from config import GEMINI_API_KEY

def load_vector_store(store_path):
    """
    Loads a local FAISS index from the specified path.
    """
    print(f"Loading vector store from: {store_path}")
    embeddings = get_embeddings_model()
    # allow_dangerous_deserialization is required to load local pickle-serialized FAISS files safely.
    return FAISS.load_local(store_path, embeddings, allow_dangerous_deserialization=True)

def query_pdf(store_path, question):
    """
    Retrieves relevant chunks and generates an answer using Gemini 1.5 Flash.
    """
    if not os.path.exists(store_path):
        return {
            "error": "The document vector store was not found. Please try re-uploading the file."
        }
        
    try:
        # 1. Load vector store
        db = load_vector_store(store_path)
        
        # 2. Retrieve top-4 most relevant chunks
        print(f"Searching database for question: '{question}'")
        docs = db.similarity_search(question, k=4)
        
        # 3. Format context & compile source references list
        context_items = []
        references = []
        for i, doc in enumerate(docs):
            page_num = doc.metadata.get("page", "Unknown")
            content = doc.page_content
            context_items.append(f"[Source {i+1} - Page {page_num}]:\n{content}")
            references.append({
                "source_id": i + 1,
                "page": page_num,
                "text": content
            })
            
        context = "\n\n".join(context_items)
        
        # 4. Construct prompt and run Gemini LLM chain
        print("Invoking Gemini LLM...")
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.2
        )
        
        system_template = (
            "You are a helpful AI assistant for the RAG PDF Assistant web application.\n"
            "Use the retrieved PDF document context below to answer the user's question.\n"
            "Keep your answer detailed, accurate, and completely grounded in the context provided if the answer is present.\n"
            "If the context does not contain the answer or enough information to answer the user's question, "
            "you MUST answer the question using your general knowledge, but you MUST start your response with "
            "the exact prefix: 'I couldn't find this in the uploaded document, but here is what I know:' "
            "followed by two newlines and then your general knowledge answer. Do not use this prefix if the answer is found in the context.\n\n"
            "Retrieved PDF Context:\n"
            "{context}\n\n"
            "User Question: {question}\n\n"
            "Structured Answer:"
        )
        
        prompt = ChatPromptTemplate.from_template(system_template)
        chain = prompt | llm | StrOutputParser()
        
        response_text = chain.invoke({
            "context": context,
            "question": question
        })
        
        return {
            "answer": response_text,
            "references": references
        }
        
    except Exception as e:
        print(f"Error querying PDF: {e}")
        return {
            "error": f"An error occurred while generating the answer: {str(e)}"
        }
