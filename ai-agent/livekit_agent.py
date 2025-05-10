import asyncio
import uuid
import sys
import requests
import websockets
import json

try:
    from livekit import rtc
    from livekit.api import AccessToken, VideoGrants
except ImportError as e:
    print(f"ERROR: LiveKit SDK not properly installed. {e}")
    sys.exit(1)

from config import HOST, API_KEY, API_SECRET, ROOM_NAME
from agent import find_answer

class SalonAIAgent:
    def __init__(self):
        self.room = rtc.Room()
        self.clients = {}  # trackimg active clients
        self.pending_help_requests = {}  # tracking {request_id: caller_id}
        self.websocket = None
        
    async def connect(self):
        # liveKit event handlers set up
        self.room.on("data_received", self._handle_data_received)
        self.room.on("participant_connected", self._handle_participant_connected)
        self.room.on("participant_disconnected", self._handle_participant_disconnected)
        
        # creating token for liveKit
        token = AccessToken(API_KEY, API_SECRET)
        token.with_grants(VideoGrants(room_join=True, room=ROOM_NAME))
        token.identity = "salon-ai-agent"
        jwt = token.to_jwt()
        
        # connecting to liveKit room
        url = f"wss://{HOST}.livekit.cloud"
        print(f"Connecting to LiveKit at {url}...")
        
        try:
            await self.room.connect(url, jwt)
            print("✅ Connected! AI Agent is running.")
            
            asyncio.create_task(self._maintain_websocket_connection())
            
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    async def _maintain_websocket_connection(self):
        """Maintain a WebSocket connection to the backend to listen for help request updates"""
        while True:
            try:
                async with websockets.connect("ws://localhost:8765") as ws:
                    self.websocket = ws
                    print("✅ Connected to backend WebSocket")
                    
                    while True:
                        message = await ws.recv()
                        await self._handle_websocket_message(message)
                        
            except Exception as e:
                print(f"WebSocket connection error: {e}")
                self.websocket = None
                
            await asyncio.sleep(5)
    
    async def _handle_websocket_message(self, message):
        """Process messages from WebSocket (help request updates)"""
        try:
            data = json.loads(message)
            print(f"Received WebSocket message: {data}")
            
            if 'type' in data and data['type'] == 'help_request_update':
                request_id = data.get('request_id')
                answer = data.get('answer')
                status = data.get('status')
                
                print(f"Help request update: {request_id}, status: {status}")
                print(f"Pending help requests: {self.pending_help_requests}")
                
                if request_id in self.pending_help_requests and status == 'answered':
                    caller_id = self.pending_help_requests[request_id]
                    print(f"Found matching request for caller: {caller_id}")
                    await self._send_supervisor_answer(caller_id, answer)
                    
                    del self.pending_help_requests[request_id]
            elif 'type' in data and data['type'] == 'resolve':
                request_id = data.get('request_id')
                answer = data.get('answer')
                
                print(f"Resolve request: {request_id}")
                print(f"Pending help requests: {self.pending_help_requests}")
                
                for req_id, caller_id in list(self.pending_help_requests.items()):
                    if req_id == request_id or req_id in request_id or request_id in req_id:
                        print(f"Found matching request for caller: {caller_id}")
                        await self._send_supervisor_answer(caller_id, answer)
                        del self.pending_help_requests[req_id]
                        break
                    
        except Exception as e:
            print(f"Error handling WebSocket message: {e}")
            import traceback
            traceback.print_exc()
    
    async def _send_supervisor_answer(self, caller_id, answer):
        """Send supervisor's answer back to the client"""
        try:
            message = f"[Supervisor Answer]: {answer}"
            print(f"Sending supervisor answer to room: {message}")
            
            await self.room.local_participant.publish_data(message.encode('utf-8'))
            print(f"Sent supervisor answer for {caller_id}: {answer}")
        except Exception as e:
            print(f"Error sending supervisor answer: {e}")
            import traceback
            traceback.print_exc()
            
    def _handle_data_received(self, *args):
        """Handle incoming data packets"""
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
            
            if not data_bytes:
                print(f"DEBUG: Can't extract data from {type(data_packet).__name__}")
                return
            
            sender_id = "unknown"
            participant = None
            
            for arg in args:
                if hasattr(arg, 'participant_identity'):
                    sender_id = arg.participant_identity
                    participant = self.room.get_participant_by_identity(sender_id)
                    break
                elif hasattr(arg, 'identity'):
                    sender_id = arg.identity
                    participant = arg
                    break
            
            message = data_bytes.decode('utf-8')
            print(f"\n[Client: {sender_id}]: {message}")
            
            asyncio.create_task(self._handle_message(message, sender_id, participant))
            
        except Exception as e:
            print(f"Error in data_received handler: {e}")
            import traceback
            traceback.print_exc()
    
    async def _handle_message(self, message, sender_id, participant):
        """Process message and send response to the same client"""
        try:
            answer = find_answer(message)
            
            if answer:
                print(f"[AI Agent]: {answer}")
                response = answer
            else:
                print(f"[AI Agent]: I'm not sure. Escalating to supervisor...")
                try:
                    request_id = str(uuid.uuid4())
                    
                    self.pending_help_requests[request_id] = sender_id
                    print(f"Created help request {request_id} for caller {sender_id}")
                    
                    res = requests.post("http://localhost:5000/api/v1/helpreq", json={
                        "question": message,
                        "caller_id": sender_id,
                        "request_id": request_id
                    })
                    print(f"[System]: Escalation created: {res.status_code}")
                    
                    if res.status_code == 201:
                        try:
                            api_request_id = res.json().get('id')
                            if api_request_id and api_request_id != request_id:
                                self.pending_help_requests[api_request_id] = sender_id
                                print(f"Mapped DB ID {api_request_id} to caller {sender_id}")
                        except:
                            pass
                    
                    response = "I'm not sure about that. I've sent your question to a supervisor who will help you shortly."
                except Exception as e:
                    print(f"[System Error]: Failed to escalate: {e}")
                    response = "I'm not sure about that, and I'm having trouble connecting to our help system. Please try again later."
            
          
            await asyncio.sleep(0.5)
            
          
            await self.room.local_participant.publish_data(response.encode('utf-8'))
                
        except Exception as e:
            print(f"Error handling message: {e}")
            error_msg = f"Sorry, I encountered an error: {str(e)}"
            await self.room.local_participant.publish_data(error_msg.encode('utf-8'))
    
    def _handle_participant_connected(self, *args):
        """Handle new participants joining"""
        try:
            participant = args[0]  
            participant_id = participant.identity if hasattr(participant, 'identity') else "unknown"
            print(f"📞 Incoming call from: {participant_id}")
            
          
            self.clients[participant_id] = participant
            
           
            asyncio.create_task(self._send_welcome(0.5))
        except Exception as e:
            print(f"Error in participant_connected handler: {e}")
    
    def _handle_participant_disconnected(self, *args):
        """Handle participants leaving"""
        try:
            participant = args[0]  
            participant_id = participant.identity if hasattr(participant, 'identity') else "unknown"
            print(f"👋 Call ended with: {participant_id}")
            
            # removing from tracked clients
            if participant_id in self.clients:
                del self.clients[participant_id]
        except Exception as e:
            print(f"Error in participant_disconnected handler: {e}")
    
    async def _send_welcome(self, delay=0):
        """Send welcome message to room after optional delay"""
        if delay > 0:
            await asyncio.sleep(delay)
        welcome_msg = "Welcome to our salon! How can I help you today?"
        await self.room.local_participant.publish_data(welcome_msg.encode('utf-8'))



async def main():
    print("===== Salon AI Agent with LiveKit =====")
    
    agent = SalonAIAgent()
    if await agent.connect():
        try:
            await asyncio.Event().wait()  # will run until interrupted
        except KeyboardInterrupt:
            print("\nShutting down agent...")
    else:
        await cli_mode()

async def cli_mode():
    """CLI mode when LiveKit connection fails"""
    print("===== Salon AI Agent (CLI Mode) =====")
    print("Type 'exit' or 'quit' to end the session")
    
    caller_id = f"caller-{uuid.uuid4().hex[:6]}"
    print(f"Simulating caller: {caller_id}")
    
    while True:
        user_input = input(f"\n[{caller_id}]: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        answer = find_answer(user_input)
        if answer:
            print(f"[AI Agent]: {answer}")
        else:
            print(f"[AI Agent]: I'm not sure. Escalating this to a supervisor...")
            try:
                res = requests.post("http://localhost:5000/api/v1/helpreq", json={
                    "question": user_input,
                    "caller_id": caller_id,
                    "request_id": str(uuid.uuid4())
                })
                print(f"[System]: Escalation created: {res.status_code}")
            except Exception as e:
                print(f"[System Error]: Failed to escalate: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nAgent stopped.")