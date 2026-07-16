import os
import re
from typing import List, Dict, Any
from pypdf import PdfReader
from fastembed import TextEmbedding

# Lazy-load the embedding model (downloads ~50MB ONNX model on first use)
_model = None

def get_embedding_model() -> TextEmbedding:
    global _model
    if _model is None:
        # all-MiniLM-L6-v2 via ONNX — identical 384-dim output, no PyTorch needed
        _model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _model

def extract_pdf_text_and_metadata(pdf_path: str) -> Dict[str, Any]:
    """
    Extracts plain text and page metadata from a PDF file.
    Returns:
        Dict containing 'text' (full text with page separators),
        'pages' (list of page dicts with page_num and text),
        'page_count' (total pages)
    """
    reader = PdfReader(pdf_path)
    page_count = len(reader.pages)
    
    full_text = ""
    pages_data = []
    
    for i, page in enumerate(reader.pages):
        page_num = i + 1
        page_text = page.extract_text() or ""
        
        # Clean double spaces/newlines slightly
        page_text = re.sub(r'[ \t]+', ' ', page_text)
        
        full_text += f"\n--- Page {page_num} ---\n{page_text}\n"
        pages_data.append({
            "page_num": page_num,
            "text": page_text
        })
        
    return {
        "text": full_text,
        "pages": pages_data,
        "page_count": page_count
    }

def chunk_text(text: str, chunk_size: int = 1200, chunk_overlap: int = 200) -> List[str]:
    """
    Splits text into overlapping chunks of a given character length.
    Attempts to break on paragraph or sentence boundaries when possible.
    """
    chunks = []
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        if end >= text_length:
            chunks.append(text[start:])
            break
            
        # Try to find a good breaking point (period, exclamation, newline) within overlap window
        break_point = -1
        search_window = text[end - chunk_overlap:end]
        
        # Look for sentence enders
        for char in ['. ', '? ', '! ']:
            pos = search_window.rfind(char)
            if pos != -1:
                break_point = (end - chunk_overlap) + pos + 1
                break
                
        # Fallback to space if no sentence ender is found
        if break_point == -1:
            pos = search_window.rfind(' ')
            if pos != -1:
                break_point = (end - chunk_overlap) + pos
                
        if break_point != -1 and break_point > start:
            chunks.append(text[start:break_point].strip())
            start = break_point
        else:
            chunks.append(text[start:end].strip())
            start = end - chunk_overlap
            
    return [c for c in chunks if len(c) > 50]  # Ignore extremely small/empty chunks

def generate_embeddings_for_chunks(chunks: List[str]) -> List[List[float]]:
    """
    Computes vector embeddings for a list of text chunks.
    """
    if not chunks:
        return []
    model = get_embedding_model()
    # fastembed returns a generator of numpy arrays
    embeddings = list(model.embed(chunks))
    return [emb.tolist() for emb in embeddings]

def generate_embedding_for_query(query: str) -> List[float]:
    """
    Computes a single vector embedding for a query string.
    """
    model = get_embedding_model()
    embeddings = list(model.embed([query]))
    return embeddings[0].tolist()
