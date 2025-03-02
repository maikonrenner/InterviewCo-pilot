# AI Interview Co-Pilot

AI Interview Co-Pilot is a Django-based application designed to help candidates prepare for job interviews using AI-powered assistance.

## Getting Started

Follow the steps below to set up and run the project on your local machine.

### 1. Clone the Repository

```sh
git clone https://github.com/nonymous911/interview-copilot.git
cd ai-interview-copilot
```

### 2. Add Your Resume and Job Description
Before starting the interview process, place your resume and job description in the appropriate folders:
- **Resume:** Replace your resume (PDF format) inside the `resume` folder.
- **Job Description:** Replace the job description (PDF format) inside the `job_description` folder.

### 3. Create API Keys
This project requires API keys from OpenAI and Deepgram.
- **OpenAI API Key:** Create an API key from [OpenAI](https://platform.openai.com/signup/)
  - Watch video: https://youtu.be/OB99E7Y1cMA?si=uEbJeVK5w8UYrHlw
- **Deepgram API Key:** Create an API key from [Deepgram](https://console.deepgram.com/signup)
  - Deepgram provides **free credits worth $200** without requiring a credit card. This covers **750 hours of interview transcription for free**.

### 4. Set Up Environment Variables
Create a `.env` file inside the `interview_copilot` folder and add the following:

```sh
DEEPGRAM_API_KEY="your_deepgram_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
```
### 5. Install requirements for the Project
Use the following command to install required python packages:

```sh
pip install -r requirements.txt
pip install --upgrade openai
```

### 6. Run the Project
Use the following command to start the Django server:

```sh
python manage.py runserver
```

### 7. Access the Application
Once the server is running, open your browser and go to:

```
http://localhost:8000
```

### 8. Demo Video
To understand the process better, watch the demo video:

![Demo Preview](assets/ai-copilot-demo.mp4)


## Good Luck with Your Interview!
If you have any issues or suggestions for improvement, feel free to reach out to us via email anonymous911mail@gmail.com.

If you find this project helpful, don't forget to ⭐ the repository!

Happy Interviewing! 🚀

