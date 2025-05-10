import asyncio
import websockets
import json

async def connect_to_agent():
    """Connect to AI agent WebSocket and handle conversation"""
    uri = "ws://localhost:8765"
    
    try:
        async with websockets.connect(uri) as websocket:
            response = await websocket.recv()
            welcome = json.loads(response)
            print(f"[AI Agent]: {welcome['message']}")
            
            while True:
                message = input("[You]: ")
                if message.lower() in ["exit", "quit"]:
                    break
                
                await websocket.send(json.dumps({
                    "message": message
                }))
                
                try:
                    response = await websocket.recv()
                    data = json.loads(response)
                    
                    if data["type"] == "answer":
                        print(f"[AI Agent]: {data['message']}")
                    elif data["type"] == "escalation":
                        print(f"[AI Agent]: {data['message']}")
                        print("[System]: Your question has been sent to a supervisor. Please wait for a response.")
                    elif data["type"] == "supervisor_response":
                        print(f"[Supervisor]: {data['message']}")
                    elif data["type"] == "error":
                        print(f"[System Error]: {data['message']}")
                    else:
                        print(f"[System]: {data['message']}")
                except websockets.exceptions.ConnectionClosed:
                    print("[System]: Connection to server lost. Exiting.")
                    break
    except ConnectionRefusedError:
        print("[System Error]: Could not connect to WebSocket server. Make sure the server is running.")
    except Exception as e:
        print(f"[System Error]: {str(e)}")

if __name__ == "__main__":
    print("===== Salon AI Client =====")
    print("Type 'exit' or 'quit' to end the conversation")
    asyncio.run(connect_to_agent())