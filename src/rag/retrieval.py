from langchain_community.retrievers import (
    BM25Retriever, 
    ContextualCompressionRetriever
)
from langchain.retrievers import EnsembleRetriever
from langchain_community.document_compressors import FlashrankRerank
from langchain_core.documents import Document
from flashrank import Ranker

from .store import get_vector_store


async def retrieve_documents(
    collection_name: str,
    document_id: str
) -> list[Document]:
    """
    Returns Documents Based on document_id
    """
    
    vector_store = await get_vector_store(collection_name)
    results = vector_store.get(where={"document_id": document_id})
    
    # ids = results["ids"]
    docs_content = results["documents"]
    metadatas = results["metadatas"]

    documents = []
    for page_content, metadata in zip(docs_content, metadatas):
        documents.append(Document(page_content, metadata=metadata))

    return documents


async def get_retriever(
    docs: list[Document],
    k: int = 10,
    top_n: int = 5
):
    vector_store = await get_vector_store()
    vector_retriever = vector_store.as_retriever(search_kwargs={"k": k})

    bm25_retriever = BM25Retriever.from_documents(docs)
    bm25_retriever.k = k

    ensemble_retriever = EnsembleRetriever(
        retrievers=[vector_retriever, bm25_retriever],
        weights=[0.6, 0.4]
    )

    ranker_client = Ranker(model_name="ms-marco-MiniLM-L-12-v2")
    compressor = FlashrankRerank(client=ranker_client, top_n=top_n)

    final_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=ensemble_retriever
    )

    return final_retriever







