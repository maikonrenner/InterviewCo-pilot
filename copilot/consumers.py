import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils import get_resume_summary, get_job_description_summary, generate_response
from datetime import datetime

class InterviewConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept the connection
        await self.accept()
        
        # Store conversation history
        self.conversation_history = []
        
        # Get summaries of resume and job description
        self.resume_summary = await asyncio.to_thread(get_resume_summary)
        self.job_summary = await asyncio.to_thread(get_job_description_summary)
        
        # Send initialization message
        await self.send(text_data=json.dumps({
            'type': 'initialization',
            'resume_summary': self.resume_summary,
            'job_summary': self.job_summary
        }))

    async def disconnect(self, close_code):
        # Clean up if needed
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'transcription':
            # Get the transcribed text
            transcribed_text = text_data_json.get('text', '')
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": transcribed_text
            })
            
            # Send acknowledgment of received question
            await self.send(text_data=json.dumps({
                'type': 'question',
                'text': transcribed_text,
                'timestamp': timestamp
            }))
            
            # Generate response
            response_stream = await asyncio.to_thread(
                generate_response, 
                self.conversation_history, 
                self.resume_summary, 
                self.job_summary
            )
            
            # Collect the full response for history
            full_response = ""
            
            # Process and send streaming response
            async for chunk in self._process_openai_stream(response_stream):
                if chunk:
                    full_response += chunk
                    await self.send(text_data=json.dumps({
                        'type': 'answer_chunk',
                        'text': chunk,
                        'timestamp': timestamp
                    }))
                    # Small delay to simulate natural typing speed
                    await asyncio.sleep(0.01)
            
            # Add AI response to conversation history
            self.conversation_history.append({
                "role": "assistant",
                "content": full_response
            })
            
            # Send end of response marker
            await self.send(text_data=json.dumps({
                'type': 'answer_complete',
                'timestamp': timestamp
            }))
    
    async def _process_openai_stream(self, response_stream):
        """Process OpenAI streaming response and yield content chunks"""
        for chunk in response_stream:
            if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                content = chunk.choices[0].delta.content
                if content:
                    yield content
            # Add a small delay between chunks to prevent overwhelming the client
            await asyncio.sleep(0.1)