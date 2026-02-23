#!/usr/bin/env bash
# Pre-download GGUF test models to a local cache directory.
# This speeds up E2E tests by avoiding in-browser/in-electron downloads.
#
# Usage: bash scripts/download_test_models.sh [--all | --fast | --medium]
#
# Models are saved to /tmp/gratisai-test-models/

set -euo pipefail

CACHE_DIR="/tmp/gratisai-test-models"
mkdir -p "$CACHE_DIR"

# Model URLs — Q2_K quantisation for smallest file sizes
declare -A MODELS
MODELS[SmolLM2-360M-Instruct.Q2_K.gguf]="https://huggingface.co/QuantFactory/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct.Q2_K.gguf"
MODELS[TinyLlama-1.1B-Chat-v1.0.Q2_K.gguf]="https://huggingface.co/QuantFactory/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/TinyLlama-1.1B-Chat-v1.0.Q2_K.gguf"
MODELS[Llama-3.2-1B-Instruct-Q2_K.gguf]="https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q2_K.gguf"
MODELS[DeepSeek-R1-Distill-Qwen-1.5B-Q2_K.gguf]="https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q2_K.gguf"
MODELS[mistral-7b-instruct-v0.2.Q2_K.gguf]="https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q2_K.gguf"

# Fast models only (for quick testing)
FAST_MODELS=("SmolLM2-360M-Instruct.Q2_K.gguf")

# Medium models (for architecture coverage without heavy download)
MEDIUM_MODELS=(
    "SmolLM2-360M-Instruct.Q2_K.gguf"
    "TinyLlama-1.1B-Chat-v1.0.Q2_K.gguf"
    "Llama-3.2-1B-Instruct-Q2_K.gguf"
    "DeepSeek-R1-Distill-Qwen-1.5B-Q2_K.gguf"
)

# Parse args
TIER="${1:---medium}"

case "$TIER" in
    --fast)
        DOWNLOAD_LIST=("${FAST_MODELS[@]}")
        echo "==> Downloading fast tier models only"
        ;;
    --medium)
        DOWNLOAD_LIST=("${MEDIUM_MODELS[@]}")
        echo "==> Downloading medium tier models (no Mistral)"
        ;;
    --all)
        DOWNLOAD_LIST=("${!MODELS[@]}")
        echo "==> Downloading all test models (including Mistral 7B)"
        ;;
    *)
        echo "Usage: $0 [--fast | --medium | --all]"
        exit 1
        ;;
esac

echo "==> Cache directory: $CACHE_DIR"
echo ""

for file_name in "${DOWNLOAD_LIST[@]}"; do
    url="${MODELS[$file_name]}"
    dest="$CACHE_DIR/$file_name"

    if [ -f "$dest" ]; then
        size=$(stat -c%s "$dest" 2>/dev/null || stat -f%z "$dest" 2>/dev/null)
        echo "  ✓ $file_name already cached ($(numfmt --to=iec $size 2>/dev/null || echo "${size} bytes"))"
        continue
    fi

    echo "  ↓ Downloading $file_name..."
    curl -L --progress-bar -o "$dest" "$url"
    echo "  ✓ $file_name downloaded"
done

echo ""
echo "==> All models cached in $CACHE_DIR"
ls -lh "$CACHE_DIR"
