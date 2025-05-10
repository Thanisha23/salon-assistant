import asyncio
import websockets
import json
from datetime import datetime
import http.server
import socketserver
import threading

help_requests = {}

class WebSocketServer:
    def __init__(self):
        self.agent_connections = set()
        self.supervisor_connections = set()
    
    async def agent_handler(self, websocket):
        """Handle connections from the AI agent"""
        print(f"Agent connected from {websocket.remote_address}")
        self.agent_connections.add(websocket)
        try:
            async for message in websocket:
                pass
        except Exception as e:
            print(f"Error with agent connection: {e}")
        finally:
            self.agent_connections.remove(websocket)
            print("Agent disconnected")
    
    async def supervisor_handler(self, websocket):
        """Handle connections from supervisors"""
        print(f"Supervisor connected from {websocket.remote_address}")
        self.supervisor_connections.add(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    print(f"Received from supervisor: {data}")
                    
                    if data.get('type') == 'answer_help_request' or data.get('type') == 'resolve':
                        request_id = data.get('request_id')
                        answer = data.get('answer')
                        
                        if request_id and answer:
                            if request_id in help_requests:
                                help_requests[request_id]['status'] = 'answered'
                                help_requests[request_id]['answer'] = answer
                            
                            print(f"Broadcasting help request update: {request_id}")
                            await self.broadcast_to_agents({
                                'type': 'help_request_update',
                                'request_id': request_id,
                                'status': 'answered',
                                'answer': answer
                            })
                            
                            await websocket.send(json.dumps({
                                'type': 'answer_confirmed',
                                'request_id': request_id
                            }))
                    
                except Exception as e:
                    print(f"Error processing supervisor message: {e}")
                    import traceback
                    traceback.print_exc()
        except Exception as e:
            print(f"Error with supervisor connection: {e}")
        finally:
            self.supervisor_connections.remove(websocket)
            print("Supervisor disconnected")
    
    async def broadcast_to_agents(self, data):
        """Send a message to all connected agents"""
        if self.agent_connections:
            message = json.dumps(data)
            print(f"Broadcasting to {len(self.agent_connections)} agents: {message}")
            await asyncio.gather(*[conn.send(message) for conn in self.agent_connections])
        else:
            print("No agents connected to broadcast to")

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/v1/helpreq":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            request_id = data.get('request_id', str(datetime.now().timestamp()))
            help_requests[request_id] = {
                'question': data.get('question', ''),
                'caller_id': data.get('caller_id', 'unknown'),
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }
            
            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'request_id': request_id,
                'status': 'created',
                'id': request_id  
            }).encode('utf-8'))
            
            asyncio.run_coroutine_threadsafe(
                ws_server.broadcast_to_agents({
                    'type': 'new_help_request',
                    'request_id': request_id,
                    'question': data.get('question', ''),
                    'caller_id': data.get('caller_id', 'unknown')
                }),
                loop
            )
            return
        
        self.send_response(404)
        self.end_headers()
    
    def do_GET(self):
        if self.path == "/api/v1/helpreq":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(help_requests).encode('utf-8'))
            return
            
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[HTTP] {self.client_address[0]} - {format % args}")

ws_server = WebSocketServer()

async def start_websocket_server():
    agent_server = await websockets.serve(ws_server.agent_handler, "localhost", 8765)
    supervisor_server = await websockets.serve(ws_server.supervisor_handler, "localhost", 8766)
    print("WebSocket servers started on ports 8765 (agent) and 8766 (supervisor)")
    
    await asyncio.gather(
        agent_server.wait_closed(),
        supervisor_server.wait_closed()
    )

def start_http_server():
    httpd = socketserver.TCPServer(("", 5000), APIHandler)
    print("HTTP server started on port 5000")
    httpd.serve_forever()

if __name__ == "__main__":
    http_thread = threading.Thread(target=start_http_server)
    http_thread.daemon = True
    http_thread.start()
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_websocket_server())