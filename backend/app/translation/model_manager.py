"""
IndicTrans2 Model Manager.

Handles loading, caching, and inference for the AI4Bharat IndicTrans2 model.
Supports both GPU and CPU inference. Gracefully degrades when the model is unavailable.

The model is loaded once at server startup and kept in memory for all requests.
"""

import os
import time
import logging
import threading
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger("jansetu.translation")


class ModelStatus(str, Enum):
    UNLOADED = "UNLOADED"
    LOADING = "LOADING"
    READY = "READY"
    FAILED = "FAILED"
    DEGRADED = "DEGRADED"


class ModelManager:
    """
    Singleton model manager for IndicTrans2 translation model.

    Lifecycle:
    - Server startup → load_model() called once
    - All translation requests reuse the same loaded model
    - If model fails to load, system operates in DEGRADED mode (pretranslated fallback)
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized"):
            return
        self._initialized = True

        self._model = None
        self._tokenizer_src = None
        self._tokenizer_tgt = None
        self._device = "cpu"
        self._model_id = os.getenv(
            "INDICTRANS_MODEL_ID", "ai4bharat/indictrans2-indic-indic-dist-320M"
        )
        self._status = ModelStatus.UNLOADED
        self._load_time: float = 0
        self._load_error: Optional[str] = None
        self._inference_count: int = 0
        self._total_inference_time: float = 0

    @property
    def status(self) -> ModelStatus:
        return self._status

    @property
    def device(self) -> str:
        return self._device

    @property
    def model_id(self) -> str:
        return self._model_id

    @property
    def is_ready(self) -> bool:
        return self._status == ModelStatus.READY

    def load_model(self) -> bool:
        """
        Load the IndicTrans2 model into memory. Called once at server startup.

        Returns:
            True if model loaded successfully, False otherwise.
        """
        if self._status == ModelStatus.READY:
            logger.info("Model already loaded and ready")
            return True

        self._status = ModelStatus.LOADING
        start_time = time.time()

        try:
            # Check for GPU availability
            device_preference = os.getenv("TRANSLATION_DEVICE", "auto")

            if device_preference == "auto":
                try:
                    import torch
                    if torch.cuda.is_available():
                        self._device = "cuda"
                    else:
                        self._device = "cpu"
                except ImportError:
                    self._device = "cpu"
            else:
                self._device = device_preference

            logger.info(f"Loading IndicTrans2 model: {self._model_id} on {self._device}")

            # Try to load IndicTrans2 via HuggingFace transformers
            try:
                self._load_with_huggingface()
            except ImportError:
                logger.warning(
                    "transformers/torch not available. "
                    "Translation engine will operate in DEGRADED mode "
                    "(using pretranslated dictionaries only)."
                )
                self._status = ModelStatus.DEGRADED
                self._load_error = "transformers not installed"
                self._load_time = time.time() - start_time
                return False
            except Exception as e:
                logger.warning(
                    f"Failed to load IndicTrans2 model: {e}. "
                    "Operating in DEGRADED mode."
                )
                self._status = ModelStatus.DEGRADED
                self._load_error = str(e)
                self._load_time = time.time() - start_time
                return False

            self._status = ModelStatus.READY
            self._load_time = time.time() - start_time
            logger.info(
                f"IndicTrans2 model loaded successfully in {self._load_time:.2f}s "
                f"on {self._device}"
            )
            return True

        except Exception as e:
            self._status = ModelStatus.DEGRADED
            self._load_error = str(e)
            self._load_time = time.time() - start_time
            logger.error(f"Model loading failed: {e}. Operating in DEGRADED mode.")
            return False

    def _load_with_huggingface(self):
        """Load model using HuggingFace transformers library."""
        import torch
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        # For the distilled model, we use the seq2seq variant
        # The model is designed for Indic → Indic and English ↔ Indic translation
        try:
            self._tokenizer_src = AutoTokenizer.from_pretrained(
                self._model_id, trust_remote_code=True
            )
            self._tokenizer_tgt = AutoTokenizer.from_pretrained(
                self._model_id, trust_remote_code=True
            )
            self._model = AutoModelForSeq2SeqLM.from_pretrained(
                self._model_id,
                trust_remote_code=True,
            )

            if self._device == "cuda":
                self._model = self._model.cuda()

            self._model.eval()
        except Exception:
            # Fallback: try the dedicated IndicTrans2 pipeline
            logger.info("Attempting IndicTrans2 dedicated pipeline loading...")
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

            self._tokenizer_src = AutoTokenizer.from_pretrained(
                self._model_id, trust_remote_code=True
            )
            self._model = AutoModelForSeq2SeqLM.from_pretrained(
                self._model_id,
                trust_remote_code=True,
            )

            if self._device == "cuda":
                self._model = self._model.cuda()

            self._model.eval()

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> Optional[str]:
        """
        Translate text using the loaded IndicTrans2 model.

        Args:
            text: Source text to translate
            source_lang: IndicTrans2 BCP-47 source code (e.g., "hin_Deva")
            target_lang: IndicTrans2 BCP-47 target code (e.g., "eng_Latn")

        Returns:
            Translated text or None if translation fails.
        """
        if not self.is_ready or not self._model:
            return None

        if not text or not text.strip():
            return None

        try:
            import torch

            start = time.time()

            # Build input with language tags
            # IndicTrans2 expects: source_lang_tag + text + target_lang_tag
            # For seq2seq models, the format is typically: "__src_lang__ text __tgt_lang__"
            src_tag = source_lang
            tgt_tag = target_lang

            # Prepare input
            input_text = f"{src_tag} {text.strip()}"
            inputs = self._tokenizer_src(
                input_text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512,
            )

            if self._device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}

            # Generate translation
            with torch.no_grad():
                outputs = self._model.generate(
                    **inputs,
                    max_length=512,
                    num_beams=4,
                    early_stopping=True,
                )

            # Decode output
            translation = self._tokenizer_tgt.decode(
                outputs[0], skip_special_tokens=True
            )

            elapsed = time.time() - start
            self._inference_count += 1
            self._total_inference_time += elapsed

            logger.debug(
                f"Translation: {source_lang}→{target_lang} in {elapsed:.3f}s "
                f"({len(text)}→{len(translation)} chars)"
            )

            return translation.strip()

        except Exception as e:
            logger.error(f"Translation inference failed: {e}")
            return None

    def translate_batch(
        self,
        texts: list,
        source_lang: str,
        target_lang: str,
    ) -> list:
        """
        Translate multiple texts at once.

        Args:
            texts: List of source texts
            source_lang: IndicTrans2 source code
            target_lang: IndicTrans2 target code

        Returns:
            List of translated texts (None for failed translations).
        """
        if not self.is_ready or not self._model:
            return [None] * len(texts)

        results = []
        for text in texts:
            result = self.translate(text, source_lang, target_lang)
            results.append(result)

        return results

    def get_health(self) -> Dict[str, Any]:
        """Return model health information."""
        avg_latency = (
            self._total_inference_time / self._inference_count
            if self._inference_count > 0
            else 0
        )

        return {
            "status": self._status.value,
            "model_id": self._model_id,
            "device": self._device,
            "load_time_seconds": round(self._load_time, 2),
            "inference_count": self._inference_count,
            "average_latency_seconds": round(avg_latency, 3),
            "error": self._load_error,
        }

    def unload(self):
        """Unload model from memory."""
        self._model = None
        self._tokenizer_src = None
        self._tokenizer_tgt = None
        self._status = ModelStatus.UNLOADED
        logger.info("Model unloaded from memory")


# Module-level singleton
model_manager = ModelManager()
