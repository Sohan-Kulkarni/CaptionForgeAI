import os
import re
import threading
import time
from difflib import SequenceMatcher
from functools import lru_cache
from io import BytesIO
from typing import Any

import torch
from PIL import Image
from huggingface_hub import login
from transformers import BlipForConditionalGeneration, BlipProcessor

from app.models.caption import CaptionItem, CaptionMode

TARGET_CAPTION_COUNT = 4
MAX_IMAGE_SIZE = (1024, 1024)

PROMPT_PREFIXES = (
    "a creative caption of",
    "a natural caption of",
    "a cinematic photo of",
    "a lively scene with",
    "an expressive image of",
    "a visually rich photo of",
    "an image showing",
    "a detailed photo of",
    "the scene shows",
    "a clear view of",
    "a photo of",
)

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "in",
    "is",
    "of",
    "on",
    "the",
    "to",
    "with",
}

TOKEN_ALIASES = {
    "canine": "dog",
    "canines": "dog",
    "outdoors": "outdoor",
    "outside": "outdoor",
    "grassy": "grass",
    "field": "grass",
    "fields": "grass",
}


class CaptionServiceError(RuntimeError):
    """Raised when the caption model cannot be loaded or used."""


# BLIP is intentionally stored at module scope so the process loads it once at
# startup and every request reuses the same in-memory model.
processor: BlipProcessor | None = None
model: BlipForConditionalGeneration | None = None
device = "cuda" if torch.cuda.is_available() else "cpu"
HF_TOKEN = os.getenv("HF_TOKEN")
_model_lock = threading.Lock()


def _model_name() -> str:
    return os.getenv("MODEL_NAME", "Salesforce/blip-image-captioning-base")


def load_model() -> None:
    global processor, model, device

    if processor is not None and model is not None:
        print("BLIP model already loaded.", flush=True)
        return

    with _model_lock:
        if processor is not None and model is not None:
            print("BLIP model already loaded.", flush=True)
            return

        model_name = _model_name()
        started_at = time.perf_counter()

        print("Loading BLIP model...", flush=True)
        print(f"Using device: {device}", flush=True)
        if HF_TOKEN:
            try:
                login(HF_TOKEN)
                print("Logged into Hugging Face Hub.", flush=True)
            except Exception as exc:
                print(f"HF login failed: {exc}", flush=True)
        print("Downloading model...", flush=True)

        try:
            loaded_processor = BlipProcessor.from_pretrained(model_name)
            model_kwargs: dict[str, Any] = {}
            if device == "cuda":
                model_kwargs["torch_dtype"] = torch.float16

            loaded_model = BlipForConditionalGeneration.from_pretrained(
                model_name,
                low_cpu_mem_usage=True,
                **model_kwargs,
            )
            loaded_model.to(device)
            loaded_model.eval()
        except Exception as exc:
            print(f"Failed to load BLIP model: {exc}", flush=True)
            raise CaptionServiceError(
                "Could not load the BLIP captioning model. Check your internet connection, "
                "model cache, and backend dependencies."
            ) from exc

        processor = loaded_processor
        model = loaded_model

        elapsed = time.perf_counter() - started_at
        print("BLIP model loaded successfully.", flush=True)
        print(f"Model startup time: {elapsed:.2f}s", flush=True)


def get_model() -> tuple[BlipProcessor, BlipForConditionalGeneration, str]:
    if processor is None or model is None:
        raise CaptionServiceError(
            "BLIP model is not loaded. Restart the backend so startup can initialize the model."
        )

    return processor, model, device


class CaptionService:
    def __init__(self) -> None:
        self.model_name = _model_name()

    def generate_captions(
        self,
        image_bytes: bytes,
        mode: CaptionMode = CaptionMode.creative,
    ) -> list[CaptionItem]:
        loaded_processor, loaded_model, active_device = get_model()
        image = self._prepare_image(image_bytes)
        strategies = self._strategies(mode)

        print(f"Selected mode: {mode.value}", flush=True)
        started_at = time.perf_counter()
        captions: list[CaptionItem] = []
        duplicate_count = 0

        for strategy in strategies:
            if len(captions) == TARGET_CAPTION_COUNT:
                break

            strategy_started_at = time.perf_counter()
            print(f"Decoding strategy: {strategy['label']}", flush=True)

            candidates = self._generate_candidates(
                loaded_processor,
                loaded_model,
                active_device,
                image,
                strategy,
            )

            elapsed = time.perf_counter() - strategy_started_at
            print(f"Generation duration ({strategy['label']}): {elapsed:.2f}s", flush=True)

            for raw_caption in candidates:
                cleaned = self._clean_caption(raw_caption)
                if not cleaned:
                    continue

                if self._is_duplicate(cleaned, captions):
                    duplicate_count += 1
                    print(f"Filtered duplicate caption: {cleaned}", flush=True)
                    continue

                captions.append(
                    CaptionItem(
                        text=cleaned,
                        confidence=self._confidence(strategy["confidence"], cleaned, len(captions)),
                        strategy=strategy["label"],
                    )
                )
                print(f"Cleaned caption {len(captions)}: {cleaned}", flush=True)

                if len(captions) == TARGET_CAPTION_COUNT:
                    break

        if len(captions) < TARGET_CAPTION_COUNT:
            captions = self._complete_with_safe_variations(captions, mode)

        total_elapsed = time.perf_counter() - started_at
        print(f"Duplicate captions filtered: {duplicate_count}", flush=True)
        print(f"Caption generation completed in {total_elapsed:.2f}s", flush=True)

        return captions[:TARGET_CAPTION_COUNT]

    def _prepare_image(self, image_bytes: bytes) -> Image.Image:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
            return image
        except Exception as exc:
            raise CaptionServiceError("The uploaded image could not be processed.") from exc

    def _generate_candidates(
        self,
        processor: BlipProcessor,
        model: BlipForConditionalGeneration,
        active_device: str,
        image: Image.Image,
        strategy: dict[str, Any],
    ) -> list[str]:
        prompt = strategy.get("prompt")
        inputs = (
            processor(images=image, text=prompt, return_tensors="pt")
            if prompt
            else processor(images=image, return_tensors="pt")
        )
        inputs = inputs.to(active_device)

        if active_device == "cuda" and "pixel_values" in inputs:
            inputs["pixel_values"] = inputs["pixel_values"].half()

        with torch.inference_mode():
            outputs = model.generate(**inputs, **strategy["generate_kwargs"])

        return [processor.decode(output, skip_special_tokens=True) for output in outputs]

    def _strategies(self, mode: CaptionMode) -> list[dict[str, Any]]:
        if mode == CaptionMode.detailed:
            return self._detailed_strategies()

        return self._creative_strategies()

    @staticmethod
    def _creative_strategies() -> list[dict[str, Any]]:
        base_kwargs = {
            "do_sample": True,
            "top_k": 40,
            "top_p": 0.9,
            "temperature": 0.8,
            "repetition_penalty": 1.3,
            "max_length": 35,
            "min_length": 8,
            "no_repeat_ngram_size": 2,
        }

        return [
            {
                "label": "creative-controlled-sample",
                "prompt": None,
                "confidence": 0.84,
                "generate_kwargs": {**base_kwargs, "num_return_sequences": 2},
            },
            {
                "label": "creative-natural",
                "prompt": "a natural caption of",
                "confidence": 0.82,
                "generate_kwargs": {**base_kwargs, "temperature": 0.76},
            },
            {
                "label": "creative-cinematic",
                "prompt": "a cinematic photo of",
                "confidence": 0.8,
                "generate_kwargs": {**base_kwargs, "temperature": 0.84},
            },
            {
                "label": "creative-lively",
                "prompt": "a lively scene with",
                "confidence": 0.79,
                "generate_kwargs": {**base_kwargs, "top_p": 0.88, "temperature": 0.82},
            },
            {
                "label": "creative-expressive",
                "prompt": "an expressive image of",
                "confidence": 0.78,
                "generate_kwargs": {**base_kwargs, "temperature": 0.86},
            },
        ]

    @staticmethod
    def _detailed_strategies() -> list[dict[str, Any]]:
        base_kwargs = {
            "num_beams": 5,
            "repetition_penalty": 1.4,
            "length_penalty": 1.0,
            "min_length": 10,
            "max_length": 45,
            "early_stopping": True,
            "no_repeat_ngram_size": 2,
        }

        return [
            {
                "label": "detailed-beam-stable",
                "prompt": None,
                "confidence": 0.93,
                "generate_kwargs": {**base_kwargs, "num_return_sequences": 2},
            },
            {
                "label": "detailed-scene",
                "prompt": "an image showing",
                "confidence": 0.9,
                "generate_kwargs": base_kwargs,
            },
            {
                "label": "detailed-object-context",
                "prompt": "a detailed photo of",
                "confidence": 0.89,
                "generate_kwargs": base_kwargs,
            },
            {
                "label": "detailed-visible-subjects",
                "prompt": "the scene shows",
                "confidence": 0.88,
                "generate_kwargs": base_kwargs,
            },
            {
                "label": "detailed-clear-view",
                "prompt": "a clear view of",
                "confidence": 0.87,
                "generate_kwargs": base_kwargs,
            },
        ]

    def _clean_caption(self, text: str) -> str:
        cleaned = text.replace("\n", " ")
        cleaned = re.sub(r"<[^>]+>", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" .,:;-")
        cleaned = self._strip_prompt_prefix(cleaned)
        cleaned = self._remove_duplicate_words(cleaned)
        cleaned = self._remove_repeated_phrases(cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" .,:;-")

        if not cleaned:
            return ""

        cleaned = cleaned[0].upper() + cleaned[1:]
        if cleaned[-1] not in ".!?":
            cleaned = f"{cleaned}."
        return cleaned

    @staticmethod
    def _strip_prompt_prefix(text: str) -> str:
        lowered = text.lower()
        for prefix in PROMPT_PREFIXES:
            if lowered.startswith(prefix):
                return text[len(prefix) :].strip(" ,:-")
        return text

    def _remove_duplicate_words(self, text: str) -> str:
        tokens = text.split()
        cleaned_tokens: list[str] = []
        previous_key = ""

        for token in tokens:
            key = self._word_key(token)
            if key and key == previous_key:
                continue
            cleaned_tokens.append(token)
            previous_key = key

        return " ".join(cleaned_tokens)

    def _remove_repeated_phrases(self, text: str) -> str:
        words = text.split()
        changed = True

        while changed:
            changed = False
            result: list[str] = []
            index = 0

            while index < len(words):
                removed_repetition = False
                for phrase_size in range(4, 1, -1):
                    first = words[index : index + phrase_size]
                    second = words[index + phrase_size : index + phrase_size * 2]

                    if len(first) == phrase_size and self._word_keys(first) == self._word_keys(second):
                        result.extend(first)
                        index += phrase_size * 2
                        changed = True
                        removed_repetition = True
                        break

                if not removed_repetition:
                    result.append(words[index])
                    index += 1

            words = result

        return " ".join(words)

    def _is_duplicate(self, text: str, accepted: list[CaptionItem]) -> bool:
        text_key = self._canonical(text)
        text_tokens = self._content_tokens(text)

        for item in accepted:
            existing_key = self._canonical(item.text)
            existing_tokens = self._content_tokens(item.text)

            if text_key == existing_key:
                return True

            similarity = SequenceMatcher(None, text_key, existing_key).ratio()
            token_overlap = self._jaccard(text_tokens, existing_tokens)
            if similarity >= 0.8 or token_overlap >= 0.68:
                return True

        return False

    @staticmethod
    def _word_key(token: str) -> str:
        key = re.sub(r"[^a-z0-9]", "", token.lower())
        return TOKEN_ALIASES.get(key, key)

    def _word_keys(self, tokens: list[str]) -> list[str]:
        return [self._word_key(token) for token in tokens]

    def _content_tokens(self, text: str) -> set[str]:
        return {
            token
            for token in (self._word_key(part) for part in text.split())
            if token and token not in STOPWORDS
        }

    @staticmethod
    def _jaccard(first: set[str], second: set[str]) -> float:
        if not first or not second:
            return 0.0
        return len(first & second) / len(first | second)

    @staticmethod
    def _canonical(text: str) -> str:
        return " ".join(re.findall(r"[a-z0-9]+", text.lower()))

    @staticmethod
    def _confidence(base: float, text: str, index: int) -> float:
        word_count = len(text.split())
        length_bonus = min(word_count, 22) * 0.003
        variety_penalty = index * 0.012
        return round(max(0.72, min(0.98, base + length_bonus - variety_penalty)), 2)

    def _complete_with_safe_variations(
        self,
        captions: list[CaptionItem],
        mode: CaptionMode,
    ) -> list[CaptionItem]:
        if not captions:
            raise CaptionServiceError("The model could not produce captions for this image.")

        templates = (
            [
                "{base}. The scene feels natural, lively, and visually engaging.",
                "{base}. The moment has a clear subject with a polished, expressive feel.",
                "{base}. The image presents a simple scene with a cinematic sense of motion.",
            ]
            if mode == CaptionMode.creative
            else [
                "{base}. The main subject and visible setting are clearly described.",
                "{base}. The image focuses on the subject within its surrounding environment.",
                "{base}. The scene is presented with stable, factual visual context.",
            ]
        )

        for item in list(captions):
            base = item.text.rstrip(".")
            for template in templates:
                if len(captions) == TARGET_CAPTION_COUNT:
                    return captions

                candidate = self._clean_caption(template.format(base=base))
                if not self._is_duplicate(candidate, captions):
                    captions.append(
                        CaptionItem(
                            text=candidate,
                            confidence=self._confidence(0.74, candidate, len(captions)),
                            strategy=f"{mode.value}-safe-variation",
                        )
                    )
                    print(f"Cleaned caption {len(captions)}: {candidate}", flush=True)

        forced_templates = (
            [
                "{base}. The framing gives the scene a more expressive, human feel.",
                "{base}. It reads as a vivid moment centered on the visible subject.",
                "{base}. The caption keeps the scene accurate while adding a warmer tone.",
            ]
            if mode == CaptionMode.creative
            else [
                "{base}. The visible subject and background context are kept in focus.",
                "{base}. It describes the subject and setting in a direct factual way.",
                "{base}. The caption emphasizes the clear visual elements in the image.",
            ]
        )
        exact_keys = {self._canonical(item.text) for item in captions}
        base = captions[0].text.rstrip(".")

        for template in forced_templates:
            if len(captions) == TARGET_CAPTION_COUNT:
                return captions

            candidate = self._clean_caption(template.format(base=base))
            key = self._canonical(candidate)
            if key in exact_keys:
                continue

            exact_keys.add(key)
            captions.append(
                CaptionItem(
                    text=candidate,
                    confidence=self._confidence(0.72, candidate, len(captions)),
                    strategy=f"{mode.value}-safe-variation",
                )
            )
            print(f"Cleaned caption {len(captions)}: {candidate}", flush=True)

        return captions[:TARGET_CAPTION_COUNT]


@lru_cache(maxsize=1)
def get_caption_service() -> CaptionService:
    return CaptionService()
