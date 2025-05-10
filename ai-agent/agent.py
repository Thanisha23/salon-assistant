import json
import requests
import asyncio


with open('knowledge_base.json', 'r') as f:
    kb = json.load(f)

def find_answer(user_input):
    """Find answer from knowledge base with improved matching"""
    user_input = user_input.lower()
    
   
    for item in kb:
        if "question" in item and item["question"].lower() in user_input:
            return item["answer"]
    
    # keyword matching for more flexibility
    for item in kb:
        if "question" in item:
            question_words = set(item["question"].lower().split())
            input_words = set(user_input.split())
            
            # If 50% or more of the question words are in the input, consider it a match
            overlap = question_words.intersection(input_words)
            if len(overlap) >= len(question_words) / 2:
                return item["answer"]
    
    return None  

async def handle_call(user_input: str):
    """Process incoming call/message"""
    answer = find_answer(user_input)
    if answer:
        print(f"[AI Agent]: {answer}")
        return answer
    else:
        print(f"[AI Agent]: I'm not sure. Escalating this to a supervisor...")
        payload = {
            "question": user_input
        }
        try:
            res = requests.post("http://localhost:5000/api/v1/helpreq", json=payload)
            print(f"[System]: Escalation created: {res.status_code}")
            return "I'm not sure about that. I've sent your question to a supervisor who can help."
        except Exception as e:
            print(f"[System Error]: Failed to escalate: {e}")
            return "I'm not sure about that, and I'm having trouble connecting to our help desk. Please try again later."

if __name__ == "__main__":
    print("===== Salon AI Agent =====")
    print("NOTE: LiveKit integration is available in livekit_agent.py but requires proper setup.")
    print("Using CLI mode for testing the AI agent functionality.")
    
    loop = asyncio.get_event_loop()
    
    print("\nAgent is ready. Type 'exit' or 'quit' to end the session.")
    while True:
        user_input = input("\n[User]: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        loop.run_until_complete(handle_call(user_input))