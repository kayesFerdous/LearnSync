from langchain_core.messages import BaseMessage, HumanMessage


async def runner(
    workflow,
    query: str,
    tag: str
    # user_id: str
):
    # Send immediate feedback
    yield {"type": "status", "message": "Thinking..."}
    
    config = {"configurable": {"thread_id": "user_id-1"}}

    try:
        async for event in workflow.astream_events(
            {"messages": [HumanMessage(query)], "tag": tag},
            config=config,
            version="v2"
        ):
            kind = event["event"]
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
