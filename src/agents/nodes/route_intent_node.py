from langchain_core.prompts import ChatPromptTemplate
from src.agents.model import AgentState
from src.core.logging_config import get_logger
from langchain_core.messages import HumanMessage

log = get_logger(__name__)


nodes = {
    'chatter': 'chat_node',
    'scheduler': 'calendar_node',
    'routine_generator': 'routine_node',
    'rag': 'rag_node'
}

def make_route_intent_node(route_intent_llm):
    async def route_intent(state: AgentState):
        tag = state['tag']
        log.info(f"from the frontend tag: {tag}")
        if tag in nodes:
            return {'tool': nodes[tag], 'metadata': state['metadata']}

        messages = state['messages']

        system_prompt = """You are a decision-making routing agent for the LearnSync application.

CLASSIFICATION RULES:

**scheduler** - User wants to CREATE, UPDATE, DELETE, or CHECK calendar events/reminders/appointments
  Keywords: schedule, remind me, calendar, meeting, appointment, at 5pm, tomorrow
  
**rag** - User asks about DOCUMENTS, FILES, NOTES, or uploaded content
  Keywords: my notes, in my documents, what did I upload, summarize the pdf, search my files
  
**chatter** - General conversation, greetings, acknowledgments, or questions about the bot
  IMPORTANT: Simple replies like "okay", "thanks", "got it", "cool" are chatter

Base your decision PRIMARILY on the LATEST USER QUERY."""

        history = "\n".join([
            f"{'User' if isinstance(chat, HumanMessage) else 'Assistant'}: {chat.content}" for chat in messages[:-1]
            ])
        user_query = messages[-1].content

        route_prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "CONVERSATION HISTORY:\n{history}\n\nLATEST USER QUERY:\n{question}")
        ])

        router_chain = route_prompt | route_intent_llm
        result = await router_chain.ainvoke({"history": history, "question": user_query})

        tag = result.tag #type: ignore 
        log.info(f"in tool_selection: {tag}")

        if tag in nodes:
            return {'tool': nodes[tag], 'metadata': state['metadata']}
        else: 
            return {'tool': 'chat_node', 'metadata': state['metadata']}

 
    return route_intent
        
