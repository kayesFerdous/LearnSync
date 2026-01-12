from typing import AsyncGenerator
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.types import Command


async def runner( workflow, payload, user_id: str, db=None ) -> AsyncGenerator[dict, None]:
    query = payload.message
    tag = payload.tag
    image_data = payload.image
    user_input = payload.user_input

    config = {
        "configurable": {
            "thread_id": user_id,
            "db": db
        }
    }

    input_data = None
    
    if user_input is not None:
        yield {"type": "status", "message": "Extracting routine from the image..."}
        # print(f"Resuming with user input: {user_input}")
        input_data = Command(resume=user_input)
    else:
        # Send immediate feedback
        yield {"type": "status", "message": "Thinking..."}
        
        # Construct the message
        if image_data:
            # User sends only image, so we provide a default prompt if query is empty
            text_content = query if query else "Analyze this image. It is a routine. Extract the routine details strictly into the requested JSON format."
            message = HumanMessage(
                content=[
                    {"type": "text", "text": text_content},
                    {
                        "type": "image_url",
                        "image_url": {"url": image_data} 
                    }
                ]
            )
        elif query:
            message = HumanMessage(content=query)
        else: 
            yield {"type": "error", "message": "there is no message and image"}
            return
            
        input_data = {
            "messages": [message], 
            "tag": tag, 
            "scratchpad": {}, 
            "user_id": user_id,
            "metadata": {}
        }

    try:
        async for event in workflow.astream_events(
            input_data,
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
            
            elif kind == "on_chain_end":
                if event["name"] == "routine_approval_node":
                    output = event["data"].get("output")
                    if output and isinstance(output, dict):
                        msgs = output.get("messages", [])
                        for m in msgs:
                            yield {"type": "chunk", "content": m.content}

        # --- Check for Interrupts ---
        snapshot = await workflow.aget_state(config)
        for task in snapshot.tasks:
            if hasattr(task, 'interrupts') and task.interrupts:
                yield {"type": "interrupt", "payload": task.interrupts[0].value}
                return

        # --- Completed ---
        yield {"type": "done"}

    except Exception as e:
        print(f"Error in runner: {e}")
        yield {"type": "error", "message": str(e)}
