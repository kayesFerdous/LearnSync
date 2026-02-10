from src.agents.model import AgentState


nodes = {
    'chatter': 'chat_node',
    'schedular': 'calendar_node',
    'routine_generator': 'routine_node',
    'rag': 'rag_node'
}

def make_tool_selection_node():
    async def tool_selection(state: AgentState):
        tag = state['tag']
        print(f"in tool_selection: {tag}")

        if tag in nodes:
            return {'tool': nodes[tag], 'metadata': state['metadata']}

        else: 
            return {'tool': 'chat_node', 'metadata': state['metadata']}

 
    return tool_selection
        
