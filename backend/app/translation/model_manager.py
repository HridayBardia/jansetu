"""
IndicTrans2 Model Manager & Neural Translation Engine.

Integrates AI4Bharat's IndicTrans2 using IndicTransToolkit and Hugging Face Transformers.
Supports GPU (CUDA FP16) and CPU (FP32) inference with automatic batching,
dynamic CUDA Out-of-Memory (OOM) recovery, and graceful degradation.
"""

import os
import gc
import time
import logging
import threading
from typing import Optional, Dict, List, Any, Union
from enum import Enum

logger = logging.getLogger("jansetu.translation")


class ModelStatus(str, Enum):
    UNLOADED = "UNLOADED"
    LOADING = "LOADING"
    READY = "READY"
    FAILED = "FAILED"
    DEGRADED = "DEGRADED"


class IndicTranslatorEngine:
    """
    Production-grade Neural Machine Translation Inference Engine
    leveraging IndicTransToolkit and Hugging Face AutoModelForSeq2SeqLM.
    """

    def __init__(
        self,
        model_name_or_path: str = "ai4bharat/indictrans2-indic-indic-dist-320M",
        device: Optional[str] = None,
        max_batch_size: int = 32,
        max_length: int = 512,
    ):
        self.model_name = model_name_or_path
        self.max_batch_size = max_batch_size
        self.max_length = max_length

        import torch
        # 1. Device configuration
        if device and device != "auto":
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # 2. Precision: FP16 on GPU for 2x throughput, FP32 on CPU
        self.torch_dtype = torch.float16 if self.device.type == "cuda" else torch.float32

        logger.info("Initializing IndicTranslatorEngine on %s (dtype=%s)", self.device, self.torch_dtype)

        # 3. Load IndicProcessor from IndicTransToolkit
        self.ip = None
        try:
            from IndicTransToolkit import IndicProcessor
            self.ip = IndicProcessor(inference=True)
            logger.info("IndicTransToolkit IndicProcessor initialized successfully.")
        except ImportError:
            logger.warning("IndicTransToolkit not installed. Using native script formatting fallback.")
            self.ip = None

        # 4. Load Tokenizer & Seq2Seq Model
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name,
            trust_remote_code=True,
        )

        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            self.model_name,
            trust_remote_code=True,
            torch_dtype=self.torch_dtype,
            low_cpu_mem_usage=True,
        ).to(self.device)

        self.model.eval()
        logger.info("Successfully loaded IndicTrans2 model: %s", self.model_name)

    def preprocess(self, texts: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        """
        Preprocesses and normalizes text batch using IndicTransToolkit's IndicProcessor.
        """
        if self.ip is not None:
            return self.ip.preprocess_batch(texts, src_lang=src_lang, tgt_lang=tgt_lang)
        
        # Fallback formatting if IndicTransToolkit is unavailable
        return [f"{src_lang} {t.strip()}" for t in texts]

    def postprocess(self, texts: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        """
        Postprocesses and detokenizes translation output.
        """
        if self.ip is not None:
            return self.ip.postprocess_batch(texts, lang=tgt_lang)
        
        # Clean up any leftover language tags
        cleaned = []
        for t in texts:
            val = t.replace(src_lang, "").replace(tgt_lang, "").strip()
            cleaned.append(val)
        return cleaned

    def _generate_chunk(self, batch_texts: List[str], src_lang: str, tgt_lang: str) -> List[str]:
        """
        Performs batched inference on a chunk of texts with dynamic CUDA OOM recovery.
        """
        if not batch_texts:
            return []

        import torch

        # Step 1: Preprocess with IndicTransToolkit
        preprocessed = self.preprocess(batch_texts, src_lang=src_lang, tgt_lang=tgt_lang)

        try:
            # Step 2: Batched Tokenization
            inputs = self.tokenizer(
                preprocessed,
                padding="longest",
                truncation=True,
                max_length=self.max_length,
                return_tensors="pt",
            ).to(self.device)

            # Step 3: Model Generation with Beam Search
            with torch.inference_mode():
                generated_tokens = self.model.generate(
                    **inputs,
                    use_cache=True,
                    min_length=0,
                    max_length=self.max_length,
                    num_beams=4,
                    num_return_sequences=1,
                )

            # Step 4: Batch Decoding
            decoded = self.tokenizer.batch_decode(
                generated_tokens,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True,
            )

            # Step 5: Postprocessing
            return self.postprocess(decoded, src_lang=src_lang, tgt_lang=tgt_lang)

        except torch.cuda.OutOfMemoryError:
            logger.warning("CUDA OOM encountered during translation. Halving batch size and retrying...")
            torch.cuda.empty_cache()
            gc.collect()

            if len(batch_texts) <= 1:
                # Single oversized text: truncate and retry
                truncated = [batch_texts[0][: len(batch_texts[0]) // 2]]
                return self._generate_chunk(truncated, src_lang, tgt_lang)

            mid = len(batch_texts) // 2
            left = self._generate_chunk(batch_texts[:mid], src_lang, tgt_lang)
            right = self._generate_chunk(batch_texts[mid:], src_lang, tgt_lang)
            return left + right

    def translate_batch(
        self,
        texts: List[str],
        src_lang: str,
        tgt_lang: str,
        chunk_size: Optional[int] = None,
    ) -> List[str]:
        """
        Translates a list of strings with chunking, preservation of empty slots,
        and automatic input filtering.
        """
        if not texts:
            return []

        chunk_size = chunk_size or self.max_batch_size
        results: List[str] = [""] * len(texts)

        valid_indices = []
        valid_texts = []

        for idx, text in enumerate(texts):
            if text is None or not str(text).strip():
                results[idx] = "" if text is None else str(text)
                continue
            valid_indices.append(idx)
            valid_texts.append(str(text).strip())

        if not valid_texts:
            return results

        # Process valid texts in chunks
        translated_valid = []
        for i in range(0, len(valid_texts), chunk_size):
            chunk = valid_texts[i : i + chunk_size]
            trans_chunk = self._generate_chunk(chunk, src_lang, tgt_lang)
            translated_valid.extend(trans_chunk)

        # Merge back into results
        for orig_idx, trans in zip(valid_indices, translated_valid):
            results[orig_idx] = trans

        return results

    def get_system_metrics(self) -> Dict[str, Any]:
        """Return device and GPU memory metrics."""
        import torch
        metrics: Dict[str, Any] = {
            "device": str(self.device),
            "model_name": self.model_name,
            "precision": str(self.torch_dtype),
            "has_indictrans_toolkit": self.ip is not None,
        }
        if self.device.type == "cuda":
            metrics["gpu_name"] = torch.cuda.get_device_name(0)
            metrics["gpu_allocated_mb"] = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
            metrics["gpu_reserved_mb"] = round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2)
            metrics["gpu_max_allocated_mb"] = round(torch.cuda.max_memory_allocated(0) / (1024 * 1024), 2)
        return metrics


class ModelManager:
    """
    Singleton model manager for IndicTrans2 translation engine.

    Lifecycle:
    - Server startup → load_model() called once
    - All translation requests reuse the same loaded model
    - If model is unavailable, system operates in DEGRADED mode with in-memory dictionaries & fallback
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

        self._engine: Optional[IndicTranslatorEngine] = None
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
        return self._status == ModelStatus.READY and self._engine is not None

    def load_model(self) -> bool:
        """
        Load the IndicTrans2 model into memory. Called once at server startup.
        """
        if self._status == ModelStatus.READY and self._engine is not None:
            logger.info("Model already loaded and ready")
            return True

        self._status = ModelStatus.LOADING
        start_time = time.time()

        try:
            device_pref = os.getenv("TRANSLATION_DEVICE", "auto")
            self._engine = IndicTranslatorEngine(
                model_name_or_path=self._model_id,
                device=device_pref,
            )
            self._device = str(self._engine.device)
            self._status = ModelStatus.READY
            self._load_time = time.time() - start_time
            logger.info(
                "IndicTrans2 engine loaded successfully in %.2fs on %s",
                self._load_time,
                self._device,
            )
            return True
        except ImportError as ie:
            logger.warning(
                "ML dependencies not available (%s). Translation operating in DEGRADED mode.",
                ie,
            )
            self._status = ModelStatus.DEGRADED
            self._load_error = f"Dependencies missing: {ie}"
            self._load_time = time.time() - start_time
            return False
        except Exception as e:
            logger.warning(
                "Failed to load IndicTrans2 model (%s). Operating in DEGRADED mode.",
                e,
            )
            self._status = ModelStatus.DEGRADED
            self._load_error = str(e)
            self._load_time = time.time() - start_time
            return False

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> Optional[str]:
        """
        Translate a single text using IndicTranslatorEngine.
        """
        if not self.is_ready or not self._engine:
            return None

        if not text or not text.strip():
            return text

        try:
            start = time.time()
            results = self._engine.translate_batch([text], source_lang, target_lang)
            elapsed = time.time() - start

            self._inference_count += 1
            self._total_inference_time += elapsed

            return results[0] if results else None
        except Exception as e:
            logger.error("Translation inference failed: %s", e)
            return None

    def translate_batch(
        self,
        texts: List[str],
        source_lang: str,
        target_lang: str,
    ) -> List[Optional[str]]:
        """
        Translate a batch of texts in parallel using IndicTranslatorEngine.
        """
        if not self.is_ready or not self._engine:
            return [None] * len(texts)

        if not texts:
            return []

        try:
            start = time.time()
            results = self._engine.translate_batch(texts, source_lang, target_lang)
            elapsed = time.time() - start

            self._inference_count += len(texts)
            self._total_inference_time += elapsed

            return results
        except Exception as e:
            logger.error("Batch translation inference failed: %s", e)
            return [None] * len(texts)

    def get_health(self) -> Dict[str, Any]:
        """Return model health information and hardware metrics."""
        avg_latency = (
            self._total_inference_time / self._inference_count
            if self._inference_count > 0
            else 0
        )

        data = {
            "status": self._status.value,
            "model_id": self._model_id,
            "device": self._device,
            "load_time_seconds": round(self._load_time, 2),
            "inference_count": self._inference_count,
            "average_latency_seconds": round(avg_latency, 3),
            "error": self._load_error,
        }

        if self.is_ready and self._engine:
            data.update(self._engine.get_system_metrics())

        return data

    def unload(self):
        """Unload model from memory."""
        self._engine = None
        self._status = ModelStatus.UNLOADED
        logger.info("Model unloaded from memory")


# Module-level singleton
model_manager = ModelManager()
