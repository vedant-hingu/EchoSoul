from __future__ import annotations
from dataclasses import dataclass
from functools import lru_cache
from typing import Tuple, List, Dict, Any
import os

# Try importing scikit-learn. If unavailable, fall back gracefully.
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
    SKLEARN_AVAILABLE = True
except Exception:  # ImportError or runtime issues
    TfidfVectorizer = None  # type: ignore
    LogisticRegression = None  # type: ignore
    Pipeline = None  # type: ignore
    SKLEARN_AVAILABLE = False

MOODS = {"happy", "sad", "angry", "anxious", "calm"}

# Small seed dataset to bias tone based on user text
TRAIN_TEXTS = [
    # positive
    "I feel great and everything is going well",
    "I'm happy and excited about today",
    "Things are awesome and I am optimistic",
    "Feeling grateful and content",
    # neutral
    "I had a normal day with some tasks",
    "It was okay, nothing special happened",
    "Just checking in, not much going on",
    "I'm writing to share an update about my day",
    # negative
    "I feel terrible and upset",
    "I'm sad and struggling a lot",
    "Everything is frustrating and I'm angry",
    "I'm anxious and worried about things",
]

TRAIN_LABELS = [
    "pos", "pos", "pos", "pos",
    "neu", "neu", "neu", "neu",
    "neg", "neg", "neg", "neg",
]

# Simple lexicons for rule-based analysis when sklearn isn't available
POSITIVE_WORDS = {
    "great", "good", "awesome", "amazing", "happy", "excited", "grateful", "content", "love", "optimistic",
}
NEGATIVE_WORDS = {
    "bad", "sad", "terrible", "awful", "upset", "frustrating", "angry", "mad", "hate", "tired", "exhausted",
}
ANXIOUS_WORDS = {
    "anxious", "worried", "nervous", "fear", "panic", "overwhelmed", "stress", "stressed", "uncertain",
}
ANGER_WORDS = {
    "angry", "furious", "mad", "rage", "annoyed", "irritated", "frustrated",
}

@lru_cache(maxsize=1)
def _model():
    if not SKLEARN_AVAILABLE:
        return None
    # Simple, fast model sufficient for light tone adjustment
    pipe = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=400)),
    ])
    pipe.fit(TRAIN_TEXTS, TRAIN_LABELS)
    return pipe

@dataclass
class Tone:
    polarity: str  # pos/neu/neg
    confidence: float


def _analyze(user_message: str) -> Tone:
    if not user_message or not user_message.strip():
        return Tone("neu", 0.0)
    # ML path
    if SKLEARN_AVAILABLE:
        pipe = _model()
        if pipe is None:
            return Tone("neu", 0.0)
        proba = getattr(pipe.named_steps["clf"], "predict_proba", None)
        if proba is None:
            label = pipe.predict([user_message])[0]
            return Tone(label, 0.5)
        probs = proba(pipe.named_steps["tfidf"].transform([user_message]))[0]
        labels = pipe.named_steps["clf"].classes_
        best_idx = probs.argmax()
        return Tone(labels[best_idx], float(probs[best_idx]))
    # Rule-based path
    text = user_message.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in text)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text)
    anx = sum(1 for w in ANXIOUS_WORDS if w in text)
    ang = sum(1 for w in ANGER_WORDS if w in text)
    score = pos - (neg + anx + ang)
    if score > 0:
        return Tone("pos", 0.6)
    if score < 0:
        return Tone("neg", 0.6)
    return Tone("neu", 0.3)


def _base_for_mood(mood: str) -> Tuple[str, str, str]:
    m = (mood or "").strip().lower()
    if m == "happy":
        return (
            "Love the positive energy!",
            "Keep noticing the little wins—what made you smile today?",
            "You're doing great; celebrate it in a small way you enjoy.",
        )
    if m == "sad":
        return (
            "I'm really sorry it's heavy right now.",
            "You're not alone—small comforts can help, like a warm drink or a short walk.",
            "If it feels right, write one kind thought to yourself.",
        )
    if m == "angry":
        return (
            "I hear how strongly you feel.",
            "Your feelings matter—let's slow the moment down together.",
            "Try 3 slow breaths (4 in, 6 out) and name the main trigger.",
        )
    if m == "anxious":
        return (
            "Thanks for sharing that—let’s ground for a moment.",
            "Try 5-4-3-2-1: name 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste.",
            "Small steps are okay; you’re not alone in this.",
        )
    # calm / default
    return (
        "Sounds steady and thoughtful.",
        "You might anchor this calm with a few deep breaths or a short reflection.",
        "What would you like to explore next?",
    )


def _closing_for_mood(mood: str) -> str:
    m = (mood or "calm").lower()
    if m == "happy":
        return "Keep that spark alive—I'm cheering for you."
    if m == "sad":
        return "You matter, and I'm here with you."
    if m == "anxious":
        return "You're safe here—one steady breath at a time."
    if m == "angry":
        return "You're not alone—we can channel this into constructive next steps."
    return "I'm here for you, at your pace."


def _polish(base: Tuple[str, str, str], tone: Tone, mood: str, user_message: str) -> str:
    a, b, c = base
    m = (mood or "calm").lower()
    # Deterministic variant selector based on user message content
    key = sum(ord(ch) for ch in (user_message or "")) % 3

    # Adjust micro-phrasing with small variations per polarity
    POS_TWEAKS = {
        "happy": [
            " Keep that momentum going—what’s one small joy to repeat?",
            " Bottle this moment—what helped most today?",
            " Share one thing you’re grateful for right now.",
        ],
        "sad": [
            " It's okay to savor even tiny bright spots when they appear.",
            " Gentle wins count—notice one small comfort nearby.",
            " If it helps, name one thing that eased today, even a little.",
        ],
        "angry": [
            " Noticing what is within your control can bring relief.",
            " A brief pause might lower the heat—what’s one next step?",
            " Try labeling the feeling from 1–10 to gauge intensity.",
        ],
        "anxious": [
            " A brief gratitude note may steady you.",
            " Try 4-6 breathing for 1 minute—see how it shifts.",
            " Pick one doable action; small is perfect.",
        ],
        "calm": [
            " Consider bookmarking what supports this calm.",
            " Note what led to this steady feeling—you can return to it.",
            " Keep a short list of things that help you stay grounded.",
        ],
    }

    NEG_TWEAKS = {
        "happy": [
            " If energy dips later, it's still okay—be gentle with yourself.",
            " Fluctuations happen; kindness to yourself helps.",
            " You can pause and reset whenever you need.",
        ],
        "sad": [
            " If it helps, reach out to someone you trust or write to me again.",
            " Small care counts—rest, water, or a warm drink.",
            " Name one feeling and one need; it can bring clarity.",
        ],
        "angry": [
            " You might step away for a minute and come back when ready.",
            " Try three slow breaths; unclench your jaw and shoulders.",
            " A short walk or cold water on wrists can reset.",
        ],
        "anxious": [
            " Try softening your shoulders and unclenching your jaw.",
            " Focus on one steady breath; count 4 in, 6 out.",
            " Ground with 5-4-3-2-1 senses.",
        ],
        "calm": [
            " If the calm wavers, return to one steady breath.",
            " If tension rises, name 3 things you can control.",
            " A 30-second stretch can keep this ease going.",
        ],
    }

    NEU_TWEAKS = {
        "happy": [
            " Noting what's working can help on tougher days.",
            " Capture this in a sentence you can revisit later.",
            " What would you like to carry forward from today?",
        ],
        "sad": [
            " A small act of care counts.",
            " What’s one gentle step that feels possible?",
            " You can take this moment by moment.",
        ],
        "angry": [
            " Naming the feeling can lower its intensity.",
            " What value feels stepped on here? Naming it might help.",
            " A brief pause can create space for choice.",
        ],
        "anxious": [
            " One small, doable step is enough.",
            " What is the next kind step—not the perfect one?",
            " Try writing the worry down; you can revisit it later.",
        ],
        "calm": [
            " A short reflection can help you choose next steps.",
            " What gentle direction would you like to explore next?",
            " Consider setting a tiny intention for the next hour.",
        ],
    }

    if tone.polarity == "pos":
        add = POS_TWEAKS.get(m, [""])[key % len(POS_TWEAKS.get(m, [""]))]
    elif tone.polarity == "neg":
        add = NEG_TWEAKS.get(m, [""])[key % len(NEG_TWEAKS.get(m, [""]))]
    else:
        add = NEU_TWEAKS.get(m, [""])[key % len(NEU_TWEAKS.get(m, [""]))]

    sentences = [a, b, c + (" " + add if add else ""), _closing_for_mood(m)]
    # Keep it concise: 2–4 short sentences
    out = " ".join(s.strip() for s in sentences if s)
    return out


def generate_response(user_message: str, mood: str) -> str:
    """Generate a concise, supportive response aligned with the selected mood,
    lightly adjusted by an ML cue derived from the user's message.
    """
    mood_norm = (mood or "calm").strip().lower()
    if mood_norm not in MOODS:
        mood_norm = "calm"
    tone = _analyze(user_message or "")
    base = _base_for_mood(mood_norm)
    return _polish(base, tone, mood_norm, user_message or "")


# ---------------- Optional: Flan-T5 integration (Hugging Face) ---------------- #
try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM  # type: ignore
    HF_AVAILABLE = True
except Exception:
    AutoTokenizer = None  # type: ignore
    AutoModelForSeq2SeqLM = None  # type: ignore
    HF_AVAILABLE = False


@lru_cache(maxsize=1)
def _t5_load():
    """Lazy-load Flan-T5 model if enabled via env and transformers is available.
    Requires a backend like PyTorch/TF/Flax installed. Will return None if unavailable.
    """
    use_t5 = str(os.environ.get('T5_ENABLED') or os.environ.get('HF_T5', '')).lower() in {'1','true','yes','on'}
    model_name = os.environ.get('T5_MODEL', 'google/flan-t5-small')
    if not (use_t5 and HF_AVAILABLE):
        return None
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        return {'tokenizer': tokenizer, 'model': model, 'name': model_name}
    except Exception:
        return None


def _build_t5_prompt(user_message: str, mood: str, history: List[Dict[str, Any]]) -> str:
    mood = (mood or 'calm').lower()
    guide = (
        "You are EchoSoul, a warm, human-like mental health companion.\n"
        f"Current mood: {mood}. Tone/style must align with this mood.\n"
        "Guidelines: Happy=cheerful+encouraging; Sad=gentle+validating; Anxious=soothing+grounding; "
        "Calm=reflective+mindful; Angry=patient+de-escalating.\n"
        "Always be supportive, avoid clinical/diagnostic claims, be concise (2–4 short sentences).\n"
    )
    ctx_lines: List[str] = []
    for turn in (history or [])[-8:]:  # limit context length
        role = turn.get('role')
        content = (turn.get('content') or '').strip()
        if role and content:
            ctx_lines.append(f"{role}: {content}")
    context = "\n".join(ctx_lines)
    closing = _closing_for_mood(mood)
    return (
        f"{guide}\n"
        f"Conversation so far:\n{context}\n\n"
        f"User: {user_message}\n"
        f"Assistant (mood-aligned, concise, supportive, end with: '{closing}'):"
    )


def generate_t5_response(user_message: str, mood: str, history: List[Dict[str, Any]]) -> str | None:
    """Generate a response using Flan-T5 if enabled and available; otherwise None."""
    bundle = _t5_load()
    if not bundle:
        return None
    tokenizer = bundle['tokenizer']
    model = bundle['model']
    prompt = _build_t5_prompt(user_message, mood, history or [])
    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True)
    except Exception:
        # If PyTorch is missing, tokenizer may still work but model won't; bail out
        return None
    try:
        outputs = model.generate(**inputs, max_new_tokens=140, temperature=0.8, do_sample=True, top_p=0.9)
        text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return text.strip()
    except Exception:
        return None
