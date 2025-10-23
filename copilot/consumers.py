import json
import asyncio
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils import get_resume_summary, get_job_description_summary, generate_response_async, get_cached_answer, cache_answer, load_faq_from_file
from datetime import datetime

class InterviewConsumer(AsyncWebsocketConsumer):
    # Class-level cache (shared across all WebSocket instances)
    _resume_cache = None
    _job_cache = None
    _cache_timestamp = None
    CACHE_TTL = 3600  # 1 hour cache
    _faq_loaded = False  # Flag to track if FAQ has been preloaded

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

        # Load FAQ from file on first connection (automatic preload for instant responses)
        if not InterviewConsumer._faq_loaded:
            await asyncio.to_thread(load_faq_from_file)
            InterviewConsumer._faq_loaded = True

        # Check cache first for massive performance boost
        current_time = time.time()
        cache_expired = (
            self._cache_timestamp is None or
            current_time - self._cache_timestamp > self.CACHE_TTL
        )

        if self._resume_cache is None or self._job_cache is None or cache_expired:
            # Cache miss - fetch and cache
            print("Cache miss - generating summaries...")
            self._resume_cache = await asyncio.to_thread(get_resume_summary)
            self._job_cache = await asyncio.to_thread(get_job_description_summary)
            self._cache_timestamp = current_time
        else:
            print("Cache hit - using cached summaries (instant!)")

        # Use cached values
        self.resume_summary = self._resume_cache
        self.job_summary = self._job_cache

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
            # Get the transcribed text, provider, and selected model
            transcribed_text = text_data_json.get('text', '')
            llm_provider = text_data_json.get('provider', 'openai')  # Default to openai
            selected_model = text_data_json.get('model', 'gpt-4o-mini')  # Default to gpt-4o-mini (faster)
            timestamp = datetime.now().strftime("%H:%M:%S")

            print(f"Received transcription: {transcribed_text}")
            print(f"LLM Provider: {llm_provider}")
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

            # Check FAQ cache first for instant response
            cached_result = await asyncio.to_thread(get_cached_answer, transcribed_text)

            full_response = ""
            is_from_cache = False

            if cached_result:
                # Use cached answer (INSTANT response!)
                full_response = cached_result['answer']
                is_from_cache = True

                # Send cache indicator FIRST
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'cache_indicator_message',
                        'cached': True,
                        'hit_count': cached_result.get('hit_count', 0)
                    }
                )

                # Send cached answer as if it was streaming (for UX consistency)
                # Split into words for smooth display
                words = cached_result['answer'].split()
                word_chunks = [' '.join(words[i:i+3]) for i in range(0, len(words), 3)]

                for chunk in word_chunks:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'answer_chunk_message',
                            'text': chunk + ' ',
                            'timestamp': timestamp
                        }
                    )
                    # Small delay to simulate streaming (for better UX)
                    await asyncio.sleep(0.05)
            else:
                # Send LLM indicator FIRST
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'cache_indicator_message',
                        'cached': False,
                        'model': selected_model,
                        'provider': llm_provider
                    }
                )

                # Generate response with selected provider and model using async client (no thread blocking!)
                response_stream = await generate_response_async(
                    self.conversation_history,
                    self.resume_summary,
                    self.job_summary,
                    selected_model,
                    llm_provider
                )

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

                # Cache the answer for future use
                await asyncio.to_thread(cache_answer, transcribed_text, full_response)

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
        """Process LLM streaming response (OpenAI or Ollama) and yield content chunks"""
        # Handle both sync (OpenAI) and async (Ollama) iterators
        if hasattr(response_stream, '__aiter__'):
            # Async iterator (Ollama)
            async for chunk in response_stream:
                if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
        else:
            # Sync iterator (OpenAI)
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

    # Handler for cache indicator messages
    async def cache_indicator_message(self, event):
        """Send cache indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'cache_indicator',
            'cached': event['cached'],
            'hit_count': event.get('hit_count', 0),
            'model': event.get('model', ''),
            'provider': event.get('provider', '')
        }))