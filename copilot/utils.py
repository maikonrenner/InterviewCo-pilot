import os
import json
import PyPDF2
from django.conf import settings
import openai

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    if not os.path.exists(file_path):
        return "PDF file not found."
    
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text()
            return text
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def get_resume_summary():
    """Get a summary of the resume."""
    resume_dir = settings.RESUME_DIR
    
    # Create directory if it doesn't exist
    if not os.path.exists(resume_dir):
        os.makedirs(resume_dir)
        return "Resume directory created. Please add your resume PDF file."
    
    resume_files = [f for f in os.listdir(resume_dir) if f.endswith('.pdf')]
    
    if not resume_files:
        return "No resume found in the resume directory."
    
    # Use the first resume found
    resume_path = os.path.join(resume_dir, resume_files[0])
    resume_text = extract_text_from_pdf(resume_path)
    
    # Generate summary using OpenAI
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant that summarizes resumes."},
            {"role": "user", "content": f"Please provide a concise summary of the following resume in about 150 words: {resume_text}"}
        ],
        max_tokens=300
    )
    
    return response.choices[0].message.content

def get_job_description_summary():
    """Get a summary of the job description."""
    job_dir = settings.JOB_DESCRIPTION_DIR
    
    # Create directory if it doesn't exist
    if not os.path.exists(job_dir):
        os.makedirs(job_dir)
        return "Job description directory created. Please add your job description PDF file."
    
    job_files = [f for f in os.listdir(job_dir) if f.endswith('.pdf')]
    
    if not job_files:
        return "No job description found in the job description directory."
    
    # Use the first job description found
    job_path = os.path.join(job_dir, job_files[0])
    job_text = extract_text_from_pdf(job_path)
    
    # Generate summary using OpenAI
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant that summarizes job descriptions."},
            {"role": "user", "content": f"Please provide a concise summary of the following job description in about 150 words: {job_text}"}
        ],
        max_tokens=300
    )
    
    return response.choices[0].message.content

def generate_response(messages, resume_summary, job_summary):
    """Generate a response based on the interview context."""
    system_prompt = f"""
    You are an interview co-pilot, helping a candidate during a job interview.
    Provide concise, professional responses to interview questions.
    
    Resume Summary: {resume_summary}
    
    Job Description Summary: {job_summary}
    
    Your responses should:
    1. Be tailored to the candidate's experience and the job requirements
    2. Be professional and conversational
    3. Be honest but positive
    4. Showcase relevant skills and experiences
    5. Be direct and to the point
    6. Generate in human language so that it doesnt look like AI generated.
    
    Answer the interviewer's questions as if you are the candidate.
    """
    
    full_messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history
    for message in messages:
        full_messages.append(message)
    
    # Generate response using OpenAI with streaming enabled
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=full_messages,
            stream=True
        )
        return response
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        # Return a simple iterator with an error message if OpenAI fails
        class ErrorResponse:
            def __init__(self, error_message):
                self.error_message = error_message
                self.sent = False
                
            def __iter__(self):
                return self
                
            def __next__(self):
                if not self.sent:
                    self.sent = True
                    
                    class Choice:
                        def __init__(self, content):
                            self.delta = type('obj', (object,), {'content': content})
                    
                    class FakeResponse:
                        def __init__(self, content):
                            self.choices = [Choice(content)]
                    
                    return FakeResponse(f"Sorry, I encountered an error: {self.error_message}")
                else:
                    raise StopIteration
        
        return ErrorResponse(str(e))
