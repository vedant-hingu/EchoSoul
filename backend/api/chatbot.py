from __future__ import annotations
# ---------------- Google Gemini (primary) ---------------- #
try:
    import google.generativeai as genai  # type: ignore
    GEMINI_AVAILABLE = True
except Exception:
    genai = None  # type: ignore
    GEMINI_AVAILABLE = False
from typing import List, Dict, Any
import os

MOODS = {"happy", "sad", "angry", "anxious", "calm"}


def _gemini_system_prompt(mood: str) -> str:
    m = (mood or 'neutral').lower()
    style = {
        'happy': 'Upbeat, encouraging, and warm. Celebrate small wins.',
        'sad': 'Gentle, validating, and compassionate. Avoid toxic positivity.',
        'angry': 'Patient, steady, and de-escalating. Acknowledge intensity; focus on grounding.',
        'anxious': 'Soothing, practical, and reassuring. Offer short grounding steps.',
        'calm': 'Reflective, mindful, and supportive.',
    }.get(m, 'Balanced, friendly, and supportive.')
    rules = (
        "You are a supportive mental health assistant and should speak like a real human. "
        "Use a warm, empathetic, and conversational tone with simple everyday language. "
        "Acknowledge feelings without judgment; avoid clinical jargon and robotic phrasing. "
        "Keep replies concise (3-5 sentences) and specific to the user's message. "
        "When appropriate, ask one short, gentle follow-up question. "
        "Avoid over-apologizing or generic responses. Do not give medical advice or claim to be a professional. "
        "If crisis or self-harm intent appears, gently encourage contacting local emergency services or a trusted person; do not provide step-by-step instructions."
    )
    return f"Tone: {style}\nGuidelines: {rules}"


def generate_gemini_response(user_message: str, mood: str, history: List[Dict[str, Any]]) -> str | None:
    """Use Google Gemini with mood-aware system prompt and short history."""
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not (GEMINI_AVAILABLE and api_key):
        return None
    try:
        genai.configure(api_key=api_key)
        model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        system_instruction = _gemini_system_prompt(mood)
        model = genai.GenerativeModel(model_name, system_instruction=system_instruction)

        # Build chat history
        chat_history = []
        for turn in (history or [])[-8:]:
            role = (turn.get('role') or '').lower()
            content = (turn.get('content') or '').strip()
            if not content:
                continue
            if role in {'assistant', 'bot', 'model'}:
                chat_history.append({"role": "model", "parts": [{"text": content}]})
            else:
                chat_history.append({"role": "user", "parts": [{"text": content}]})

        chat = model.start_chat(history=chat_history)
        cfg = genai.types.GenerationConfig(
            max_output_tokens=350,
            temperature=0.7,
            top_p=0.9,
        )
        resp = chat.send_message(user_message or '', generation_config=cfg)
        text = (resp.text or '').strip()
        print("chatbot working")
        return text if text else None
    except Exception:
        return None

