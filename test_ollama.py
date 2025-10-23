"""
Test script to verify Ollama integration works correctly.
Run with: python test_ollama.py
"""

import os
import sys
import django
import asyncio

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'interview_copilot.settings')
django.setup()

from django.conf import settings
from copilot.utils import generate_response_async

async def test_ollama():
    """Test Ollama response generation."""
    print("=" * 80)
    print("OLLAMA INTEGRATION TEST")
    print("=" * 80)
    print(f"\nConfiguration:")
    print(f"  LLM Provider: {settings.LLM_PROVIDER}")
    print(f"  Ollama URL: {settings.OLLAMA_BASE_URL}")
    print(f"  Ollama Model: {settings.OLLAMA_MODEL}")
    print("\n" + "=" * 80)

    # Test data
    resume_summary = """
    Senior Data Engineer with 5 years of experience.
    Skills: Python, PySpark, SQL, AWS, Airflow.
    Experience: Built ETL pipelines processing 50GB daily data.
    """

    job_summary = """
    Looking for a Data Engineer with Python and SQL expertise.
    Must have experience with ETL pipelines and cloud platforms.
    """

    messages = [
        {"role": "user", "content": "What are the main SQL command categories?"}
    ]

    print("\nTest Question: 'What are the main SQL command categories?'")
    print("\nGenerating response...")
    print("-" * 80)

    try:
        # Generate response
        response_stream = await generate_response_async(
            messages=messages,
            resume_summary=resume_summary,
            job_summary=job_summary
        )

        full_response = ""

        # Collect streaming response
        async for chunk in response_stream:
            if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                content = chunk.choices[0].delta.content
                if content:
                    print(content, end='', flush=True)
                    full_response += content

        print("\n" + "-" * 80)
        print(f"\n[OK] TEST PASSED!")
        print(f"\nFull response ({len(full_response)} characters):")
        print(f"\n{full_response}")
        print("\n" + "=" * 80)

        return True

    except Exception as e:
        print("\n" + "-" * 80)
        print(f"\n[FAILED] TEST FAILED!")
        print(f"\nError: {str(e)}")
        print("\n" + "=" * 80)
        import traceback
        traceback.print_exc()
        return False

async def test_openai():
    """Test OpenAI response generation (if configured)."""
    if not settings.OPENAI_API_KEY:
        print("\n[WARNING] OpenAI API key not configured, skipping OpenAI test.")
        return True

    print("\n" + "=" * 80)
    print("OPENAI INTEGRATION TEST")
    print("=" * 80)

    # Temporarily switch to OpenAI
    original_provider = settings.LLM_PROVIDER
    settings.LLM_PROVIDER = 'openai'

    print(f"\nConfiguration:")
    print(f"  LLM Provider: {settings.LLM_PROVIDER}")
    print(f"  Model: gpt-4o-mini")
    print("\n" + "=" * 80)

    resume_summary = "Senior Data Engineer with Python and SQL skills."
    job_summary = "Looking for Data Engineer with Python expertise."
    messages = [
        {"role": "user", "content": "What is ETL?"}
    ]

    print("\nTest Question: 'What is ETL?'")
    print("\nGenerating response...")
    print("-" * 80)

    try:
        response_stream = await generate_response_async(
            messages=messages,
            resume_summary=resume_summary,
            job_summary=job_summary
        )

        full_response = ""

        async for chunk in response_stream:
            if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                content = chunk.choices[0].delta.content
                if content:
                    print(content, end='', flush=True)
                    full_response += content

        print("\n" + "-" * 80)
        print(f"\n[OK] OPENAI TEST PASSED!")
        print("\n" + "=" * 80)

        # Restore original provider
        settings.LLM_PROVIDER = original_provider
        return True

    except Exception as e:
        print("\n" + "-" * 80)
        print(f"\n[FAILED] OPENAI TEST FAILED!")
        print(f"\nError: {str(e)}")
        print("\n" + "=" * 80)

        # Restore original provider
        settings.LLM_PROVIDER = original_provider
        return False

async def main():
    """Run all tests."""
    print("\n>> Starting LLM Integration Tests...\n")

    results = []

    # Test based on current provider
    if settings.LLM_PROVIDER == 'ollama':
        results.append(("Ollama", await test_ollama()))
        results.append(("OpenAI", await test_openai()))
    else:
        results.append(("OpenAI", await test_openai()))

        # Only test Ollama if it's available
        try:
            import requests
            response = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2)
            if response.status_code == 200:
                # Temporarily switch to Ollama
                original_provider = settings.LLM_PROVIDER
                settings.LLM_PROVIDER = 'ollama'
                results.append(("Ollama", await test_ollama()))
                settings.LLM_PROVIDER = original_provider
            else:
                print("\n[WARNING] Ollama server not available, skipping Ollama test.")
        except:
            print("\n[WARNING] Ollama server not available, skipping Ollama test.")

    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    for name, passed in results:
        status = "[OK] PASSED" if passed else "[FAILED] FAILED"
        print(f"  {name}: {status}")
    print("=" * 80 + "\n")

    all_passed = all(result[1] for result in results)

    if all_passed:
        print("[SUCCESS] All tests passed! Integration is working correctly.\n")
        sys.exit(0)
    else:
        print("[WARNING] Some tests failed. Check the errors above.\n")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
