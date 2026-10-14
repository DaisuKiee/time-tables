import os
from google import genai

# Read the key from the environment. Never hardcode credentials here:
# this file is committed to the repository, and a literal key published to
# a public remote will be detected and revoked automatically.
#
#   PowerShell:  $env:GEMINI_API_KEY_1 = "your-key"
#   bash:        export GEMINI_API_KEY_1="your-key"
api_key = os.environ.get("GEMINI_API_KEY_1")
if not api_key:
    raise SystemExit(
        "GEMINI_API_KEY_1 is not set. Export it before running this script."
    )

client = genai.Client(api_key=api_key)

stream = client.interactions.create(
    model="gemini-3.6-flash",
    input="Hello! Explain what a Discord bot is.",
    stream=True
)

for event in stream:
    if event.event_type == "step.delta":
        if event.delta.type == "text":
            print(event.delta.text, end="", flush=True)
