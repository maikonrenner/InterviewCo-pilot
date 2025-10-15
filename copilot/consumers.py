import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils import get_resume_summary, get_job_description_summary, generate_response
from datetime import datetime

class InterviewConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join room group
        self.room_group_name = 'interview_room'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

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
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'live_transcript_update':
            # Broadcast live transcript to all connected clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'live_transcript_message',
                    'text': text_data_json.get('text', ''),
                    'is_final': text_data_json.get('is_final', False)
                }
            )

        elif message_type == 'transcription':
            # Get the transcribed text and selected model
            transcribed_text = text_data_json.get('text', '')
            selected_model = text_data_json.get('model', 'gpt-4')  # Default to gpt-4
            timestamp = datetime.now().strftime("%H:%M:%S")

            print(f"Received transcription: {transcribed_text}")
            print(f"Selected model: {selected_model}")

            # Use transcript directly - no need for extraction (saves API call and time)
            # Truncate only for display if very long, but keep full transcript for LLM context
            display_question = transcribed_text if len(transcribed_text) <= 500 else transcribed_text[:500] + "..."

            # Add FULL transcript to conversation history for LLM context
            self.conversation_history.append({
                "role": "user",
                "content": transcribed_text
            })

            # Broadcast question to all connected clients (web + electron)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'question_message',
                    'text': display_question,
                    'timestamp': timestamp
                }
            )

            # Generate response with selected model
            response_stream = await asyncio.to_thread(
                generate_response,
                self.conversation_history,
                self.resume_summary,
                self.job_summary,
                selected_model
            )
            
            # Collect the full response for history
            full_response = ""
            
            # Process and send streaming response to all clients
            async for chunk in self._process_openai_stream(response_stream):
                if chunk:
                    full_response += chunk
                    # Broadcast to all connected clients (web + electron)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'answer_chunk_message',
                            'text': chunk,
                            'timestamp': timestamp
                        }
                    )

            # Add AI response to conversation history
            self.conversation_history.append({
                "role": "assistant",
                "content": full_response
            })

            # Broadcast end of response marker to all clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'answer_complete_message',
                    'timestamp': timestamp
                }
            )
    
    async def _process_openai_stream(self, response_stream):
        """Process OpenAI streaming response and yield content chunks"""
        for chunk in response_stream:
            if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                content = chunk.choices[0].delta.content
                if content:
                    yield content

    # Handler for live transcript messages from the group
    async def live_transcript_message(self, event):
        """Send live transcript to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'live_transcript_update',
            'text': event['text'],
            'is_final': event['is_final']
        }))

    # Handler for question messages from the group
    async def question_message(self, event):
        """Send question to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'question',
            'text': event['text'],
            'timestamp': event['timestamp']
        }))

    # Handler for answer chunk messages from the group
    async def answer_chunk_message(self, event):
        """Send answer chunk to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'answer_chunk',
            'text': event['text'],
            'timestamp': event['timestamp']
        }))

    # Handler for answer complete messages from the group
    async def answer_complete_message(self, event):
        """Send answer complete marker to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'answer_complete',
            'timestamp': event['timestamp']
        }))