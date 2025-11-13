from src.services.llm_service import setup_groq_llm

class TextEditor():
    def __init__(self, llm) -> None:
        self.llm = llm


    @classmethod
    async def init(cls):
        llm = await setup_groq_llm(temperature=0.1, max_tokens=2000)
        return cls(llm)


    async def convert(self, text: str):
        prompt = f"""
        system: convert the following Banglish sentence into English. Just return the converted text
        sentence: {text}
        """

        response = self.llm.invoke(prompt)
        return response.content


