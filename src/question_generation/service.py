import asyncio
import os
import tempfile
from langchain_core.language_models import BaseChatModel
from langchain_docling.loader import DoclingLoader, ExportType
from supabase import create_async_client, AsyncClient

from src.core.config import settings
from src.core.logging_config import get_logger
from src.question_generation.schema import QuestionList
from src.services.llm_service import setup_gemini_llm

log = get_logger(__name__)

class QuestionGenerator:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm

    @classmethod
    async def initiate(cls):
        llm = await setup_gemini_llm(
            model="gemini-2.5-flash",
            temperature=0.9,
            max_tokens=8000000
        )
        return QuestionGenerator(llm)


    async def _load_file(self, filename: str):
        supabase: AsyncClient = await create_async_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY) # it shuold be in the utils folder
        log.debug(f"Processing file upload: {filename}")
        file_bytes = await supabase.storage.from_(settings.SUPABASE_BUCKET).download(f"{settings.SUPABASE_FOLDER}/{filename}")
        temp_path = None
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=filename) as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
                log.info(f"Temp file created at: {temp_path}")

                loader = DoclingLoader(
                    file_path=temp_path,
                    export_type=ExportType.MARKDOWN
                )
                log.debug(f"Loading documents from source: {temp_path}")
                docs = await loader.aload()
                log.debug(f"Loaded {len(docs)} document(s)")

                return docs

        except Exception as e:
            log.error(f"Error while processing file upload '{filename}': {e}", exc_info=True)
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                    log.info(f"Cleaned up temp file after error: {temp_path}")
                except OSError as cleanup_error:
                    print(f"Failed to cleanup temp file '{temp_path}': {cleanup_error}")
            raise
                
    
    
    async def generate_questions(self, filename: str, num_questions: int = 5) -> QuestionList:
        docs = await self._load_file(filename)

        structured_llm = self.llm.with_structured_output(QuestionList)

        prompt = f"""
        Generate {num_questions} multiple-choice questions from the following text.
        Each question should have exactly 4 options.
        Clearly indicate the integer keys of the correct answer(s) in the 'answers' list.
        
        Text:
        {docs}
        """
        
        try:
            questions: QuestionList = await structured_llm.ainvoke(prompt)
            return questions
        except Exception as e:
            log.error(f"Error generating questions: {e}", exc_info=True)
            raise        


async def run():
    filename = "1764516076607-08-prediction-of-author-s-profile-basing-on-fine-tuning-bert-model.pdf"
    qg = await QuestionGenerator.initiate()
    print(f"nnresponse: \n{await qg.generate_questions(filename)}\n\n")
    
if __name__  == "__main__":
    asyncio.run(run())
