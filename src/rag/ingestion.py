""" 
  1. `extract_text_from_pdf(file_path: str) -> str`
       * Reads the PDF file and converts its content into a raw text string.

   2. `create_text_chunks(text: str, chunk_size: int, chunk_overlap: int) -> List[Document]`
       * Splits the raw text into smaller, manageable chunks (e.g., using RecursiveCharacterTextSplitter) to ensure they fit within the embedding model's context window.

   3. `index_documents(documents: List[Document], collection_name: str) -> None`
       * Takes the chunked documents, generates embeddings for them (using the store), and persists them into the Vector Database (Chroma).

   4. `process_and_ingest_file(file_path: str, collection_name: str) -> None`
       * The main coordinator function that calls the three functions above in order: Extract -> Chunk -> Index.

"""

# from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain_text_splitters import ExperimentalMarkdownSyntaxTextSplitter
# from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.core.splitter import split_md_by_section
from api.services.vector_store import setup_vector_store


async def load_and_index(path:str):
    """Load pdf, split, embedding""" 

    # loader = UnstructuredMarkdownLoader(path) #accepts Path instance
    # docs = loader.load()
    # splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    splitted_docs = split_md_by_section(file_location=path)

    vector_store = await setup_vector_store()
    await vector_store.aadd_documents(splitted_docs)
    print("\nvecotr was storred ...\n")


async def main():
    print("Loading and indexing data...")
    pdf_path = "./data/info.md"
    await load_and_index(pdf_path)
    print("Data loaded and indexed successfully.")


if __name__ == "__main__":
    asyncio.run(main())


