"""Curated catalog of small, laptop-friendly Hugging Face models."""
from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class CatalogModel:
    repo_id: str
    display_name: str
    family: str
    params_b: float
    min_ram_gb: float
    context: int
    recommended_dtype: str  # "bf16" | "fp16" | "fp32"
    gated: bool = False
    description: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


CATALOG: list[CatalogModel] = [
    CatalogModel(
        repo_id="HuggingFaceTB/SmolLM2-135M-Instruct",
        display_name="SmolLM2 135M Instruct",
        family="SmolLM2",
        params_b=0.135,
        min_ram_gb=2,
        context=8192,
        recommended_dtype="bf16",
        description="Tiny but capable — perfect for testing and instant responses.",
    ),
    CatalogModel(
        repo_id="HuggingFaceTB/SmolLM2-360M-Instruct",
        display_name="SmolLM2 360M Instruct",
        family="SmolLM2",
        params_b=0.36,
        min_ram_gb=2,
        context=8192,
        recommended_dtype="bf16",
        description="Great balance of speed and quality for low-end laptops.",
    ),
    CatalogModel(
        repo_id="HuggingFaceTB/SmolLM2-1.7B-Instruct",
        display_name="SmolLM2 1.7B Instruct",
        family="SmolLM2",
        params_b=1.7,
        min_ram_gb=6,
        context=8192,
        recommended_dtype="bf16",
        description="Strong small model with chat tuning.",
    ),
    CatalogModel(
        repo_id="Qwen/Qwen2.5-0.5B-Instruct",
        display_name="Qwen2.5 0.5B Instruct",
        family="Qwen2.5",
        params_b=0.5,
        min_ram_gb=3,
        context=32768,
        recommended_dtype="bf16",
        description="Multilingual, long context, very fast.",
    ),
    CatalogModel(
        repo_id="Qwen/Qwen2.5-1.5B-Instruct",
        display_name="Qwen2.5 1.5B Instruct",
        family="Qwen2.5",
        params_b=1.5,
        min_ram_gb=5,
        context=32768,
        recommended_dtype="bf16",
        description="Excellent quality-per-byte; great default.",
    ),
    CatalogModel(
        repo_id="Qwen/Qwen2.5-3B-Instruct",
        display_name="Qwen2.5 3B Instruct",
        family="Qwen2.5",
        params_b=3.0,
        min_ram_gb=10,
        context=32768,
        recommended_dtype="bf16",
        description="Top quality at 3B — needs 10+ GB RAM.",
    ),
    CatalogModel(
        repo_id="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        display_name="TinyLlama 1.1B Chat",
        family="TinyLlama",
        params_b=1.1,
        min_ram_gb=4,
        context=2048,
        recommended_dtype="bf16",
        description="Classic small chat model.",
    ),
    CatalogModel(
        repo_id="microsoft/Phi-3-mini-4k-instruct",
        display_name="Phi-3 mini 4k Instruct",
        family="Phi-3",
        params_b=3.8,
        min_ram_gb=10,
        context=4096,
        recommended_dtype="bf16",
        description="Microsoft's strong small reasoning model.",
    ),
    CatalogModel(
        repo_id="meta-llama/Llama-3.2-1B-Instruct",
        display_name="Llama 3.2 1B Instruct",
        family="Llama 3.2",
        params_b=1.0,
        min_ram_gb=4,
        context=131072,
        recommended_dtype="bf16",
        gated=True,
        description="Meta's tiny Llama. Requires HF token + license acceptance.",
    ),
    CatalogModel(
        repo_id="meta-llama/Llama-3.2-3B-Instruct",
        display_name="Llama 3.2 3B Instruct",
        family="Llama 3.2",
        params_b=3.0,
        min_ram_gb=10,
        context=131072,
        recommended_dtype="bf16",
        gated=True,
        description="Meta's 3B Llama. Requires HF token + license acceptance.",
    ),
    CatalogModel(
        repo_id="google/gemma-2-2b-it",
        display_name="Gemma 2 2B Instruct",
        family="Gemma 2",
        params_b=2.6,
        min_ram_gb=8,
        context=8192,
        recommended_dtype="bf16",
        gated=True,
        description="Google's 2B chat model. Requires HF token + license acceptance.",
    ),
]


def get(repo_id: str) -> CatalogModel | None:
    return next((m for m in CATALOG if m.repo_id == repo_id), None)

