from langchain_core.messages import BaseMessage, HumanMessage


async def runner(
    workflow,
    query: str,
    tag: str
    # user_id: str
):
    # Send immediate feedback
    yield {"type": "status", "message": "Thinking..."}
    
    # current_node = None
    config = {"configurable": {"thread_id": "user_id-1"}}

    try:
        async for event in workflow.astream_events(
            {"messages": [HumanMessage(query)], "tag": tag},
            config=config,
            version="v2"
        ):
            kind = event["event"]
            name = event.get("name", "")

            # --- Chain start ---
            # if kind == "on_chain_start":
            #     if name in workflow.nodes:
            #         current_node = name
            #         if name not in ['chat_node', 'tool_selection']:
            #             yield {
            #                 "type": "step",
            #                 "name": name,
            #                 "message": "Processing your request…"
            #             }
            #
            # # --- Chain end ---
            # elif kind == "on_chain_end":
            #     if name in workflow.nodes:
            #         if name not in ['chat_node', 'tool_selection']:
            #             yield {
            #                 "type": "step",
            #                 "name": name,
            #                 "message": "Stpe completed"
            #             }
            #         if name == current_node:
            #             current_node = None
            #
            # # --- Tool start ---
            # elif kind == "on_tool_start":
            #     yield {
            #         "type": "step",
            #         "name": name,
            #         "message": f"Gathering information…"
            #     }
            #
            # # --- Tool end ---
            # elif kind == "on_tool_end":
            #     yield {
            #         "type": "step",
            #         "name": name,
            #         "message": "Done with that."
            #     }
            #
            # # --- Model tokens ---
            if kind == "on_chat_model_stream":
                chunk = event["data"].get("chunk")
                if not isinstance(chunk, BaseMessage):
                    continue
                
                if chunk.content:
                    yield {"type": "chunk", "content": chunk.content}

        # --- Completed ---
        yield {"type": "done"}

    except Exception as e:
        yield {"type": "error", "message": str(e)}
