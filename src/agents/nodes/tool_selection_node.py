from src.agents.model import AgentState


nodes = {
    'chatter': 'chat_node',
    'schedular': 'calendar_node'
}

def make_tool_selection_node():
    async def tool_selection(state: AgentState):
        tag = state['tag']
        print(f"in tool_selection: {tag}")

        if tag in nodes:
            return {'tool': nodes['tag']}

        else: 
            return {'tool': 'chat_node'}

 
    return tool_selection
        
