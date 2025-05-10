import asyncio
import sys
import uuid
from livekit import rtc
from livekit.api import AccessToken, VideoGrants
from config import HOST, API_KEY, API_SECRET, ROOM_NAME

seen_messages = set()
last_question = None
welcome_shown = False

async def test_client():
    room = rtc.Room()
    
    token = AccessToken(API_KEY, API_SECRET)
    token.with_grants(VideoGrants(room_join=True, room=ROOM_NAME))
    token.identity = "test-client"
    jwt = token.to_jwt()
    
    url = f"wss://{HOST}.livekit.cloud"
    print(f"Connecting to LiveKit at {url}...")
    
    try:
        room.on("data_received", data_received_handler)
        
        # connecting to the room
        await room.connect(url, jwt)
        print("✅ Connected to salon room!")
        print("Type messages to interact with the salon AI agent...")
        
       
        await asyncio.sleep(1)
        
        while True:
            message = input("\nType message (or 'exit' to quit): ")
            if message.lower() == "exit":
                break
            
            global last_question
            last_question = message
            
            seen_messages.add(message)
            
            await room.local_participant.publish_data(message.encode('utf-8'))
            
            for _ in range(5):  
                await asyncio.sleep(0.5)
                if last_question is None:  
                    break
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        print("Disconnecting...")
        try:
            await room.disconnect()
        except:
            pass
        print("Disconnected from room")

def data_received_handler(*args):
    """Handle data received events with improved processing"""
    try:
        data_packet = args[0]
        data_bytes = None
        
        if isinstance(data_packet, bytes):
            data_bytes = data_packet
        elif hasattr(data_packet, 'data'):
            data_bytes = data_packet.data
        elif hasattr(data_packet, 'payload'):
            data_bytes = data_packet.payload
        elif hasattr(data_packet, 'value'):
            data_bytes = data_packet.value
        elif hasattr(data_packet, 'bytes'):
            data_bytes = data_packet.bytes
        
        if not data_bytes:
            print("DEBUG: Cannot extract data from packet. Available attributes:",
                  [attr for attr in dir(data_packet) if not attr.startswith('_')])
            return
        
        message = data_bytes.decode('utf-8')
        
        global welcome_shown
        global last_question
        
        if message in seen_messages:
            return
            
        if "Welcome to our salon" in message:
            if not welcome_shown:
                print(f"[Agent]: {message}")
                welcome_shown = True
            return
        
        if message.startswith("[Supervisor Answer]:"):
            print(f"\n{message}")
            last_question = None
            return
        
        if last_question is not None:
            print(f"[Agent]: {message}")
            last_question = None
        else:
            print(f"[Agent]: {message}")
        
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        asyncio.run(test_client())
    except KeyboardInterrupt:
        print("\nClient stopped.")