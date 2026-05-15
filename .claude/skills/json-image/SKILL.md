---
name: json-image
description: Generate preview images from JSON prompt templates. Reads example_cases.json for a style, substitutes environment_variables into prompt-template.json, and concurrently invokes image-gen (Replicate + GPT Image 2). Trigger when user mentions json-image, generating images from JSON prompts, rendering style previews, or producing images from a style template at a specific ratio.
---

# JSON Image

Generate preview images for a visual style by resolving JSON prompt templates. Reads `example_cases.json` for the style, substitutes each case's `environment_variables` into `prompt-template.json`, then concurrently invokes image-gen (Replicate + GPT Image 2) to render all images.

## Trigger

Use this skill when the user wants to:
- Generate all preview images for a specific style (e.g., "json-image 404-Renaissance at 9:16")
- Render example cases from a style template ("render all digital-editorial-collage cases in 16:9")
- Regenerate preview images after updating a template or cases

## Inputs

The user must provide, or be prompted for:
1. **Style name** — the visual style directory under `styles/` (e.g., `404-Renaissance`, `digital-editorial-collage`)
2. **Aspect ratio** — the target ratio (e.g., `9:16`, `16:9`)

Defaults (can be overridden):
- Channel: `replicate`
- Model: `openai/gpt-image-2`
- Quality: `high`
- Output format: `png`

## Style Name Resolution

Match the user's input to a `styles/` subdirectory using this mapping. If no match, present the available styles and ask the user to clarify.

| User input (case-insensitive) | Resolved directory |
|---|---|
| `404-renaissance`, `renaissance`, `404` | `styles/404-Renaissance` |
| `digital-editorial-collage`, `digital editorial collage`, `editorial collage`, `digital editorial`, `collage` | `styles/digital-editorial-collage` |

## Aspect Ratio Resolution

Convert user input to the two formats needed:

| User input | `example_cases` JSON key | Metadata table value |
|---|---|---|
| `9:16` | `example_cases_9_16` | `9:16` |
| `16:9` | `example_cases_16_9` | `16:9` |
| `1:1` | `example_cases_1_1` | `1:1` |
| `3:2` | `example_cases_3_2` | `3:2` |
| `4:3` | `example_cases_4_3` | `4:3` |

General rule: replace `:` with `_` for the JSON key, keep `:` for the metadata table.

**Important**: GPT Image 2 only supports aspect ratios `1:1`, `3:2`, `2:3` via API parameter. The ratio is injected into the prompt text via the metadata table so the model can follow it, but is NOT passed as a CLI flag.

## Preflight Checks

Before generating, verify:
1. The resolved style directory exists under `styles/`
2. `prompt-template.json` exists in that directory
3. `example_cases.json` exists in that directory
4. The `example_cases_<ratio>` array exists and is non-empty

If any check fails, report the specific issue to the user and stop.

## Workflow

### Step 1: Assemble Prompt Files

Run the helper script to produce one `.md` prompt file per example case. The `--aspect-ratio` value is written into the markdown metadata table so image-gen appends it to the prompt text:

```bash
npx tsx .claude/skills/json-image/scripts/assemble-prompt.ts \
  --template styles/<style>/prompt-template.json \
  --cases styles/<style>/example_cases.json \
  --ratio-key <snake_case_ratio> \
  --aspect-ratio <colon_ratio> \
  --output-dir /tmp/json-image-<style>-<ratio>
```

The script outputs the paths of all generated `.md` files, one per line, sorted by case index. These are temporary files — they will be cleaned up after generation.

### Step 2: Probe (Single Image Test)

Generate the first image to validate the full pipeline before running the batch. If this fails, stop immediately and report the error.

- Use the **absolute path** for IMAGE_GEN: `/home/node/.claude/skills/image-gen/scripts/generate.ts`
- Do **NOT** pass `--aspect-ratio` as a CLI flag (GPT Image 2 rejects values beyond 1:1, 3:2, 2:3)
- Aspect ratio is already embedded in the prompt via the metadata table

```bash
set -euo pipefail
IMAGE_GEN=/home/node/.claude/skills/image-gen/scripts/generate.ts
OUT_DIR=styles/<style>/preview/<snake_case_ratio>
mkdir -p "$OUT_DIR"

FIRST=$(head -1 /tmp/json-image-<style>-<ratio>/manifest.txt)

npx tsx "$IMAGE_GEN" \
  --file "$FIRST" \
  --channel replicate \
  --model openai/gpt-image-2 \
  --quality high \
  --output "$OUT_DIR/01.png"
```

### Step 3: Concurrent Generation

If the probe succeeds, generate the remaining images concurrently using `xargs -P`. Export variables so they are accessible inside `xargs` subprocesses. Recommended concurrency: 5.

```bash
set -euo pipefail
export IMAGE_GEN=/home/node/.claude/skills/image-gen/scripts/generate.ts
export OUT_DIR=styles/<style>/preview/<snake_case_ratio>

tail -n +2 /tmp/json-image-<style>-<ratio>/manifest.txt \
  | xargs -I{} -P 5 bash -c '
      set -euo pipefail
      INDEX=$(basename "$1" .md)
      npx tsx "$IMAGE_GEN" \
        --file "$1" \
        --channel replicate \
        --model openai/gpt-image-2 \
        --quality high \
        --output "$OUT_DIR/${INDEX}.png"
    ' _ {}
```

If any image in the batch fails, the entire batch fails (`set -euo pipefail` in each subprocess).

### Step 4: Cleanup

Remove the temporary prompt files:

```bash
rm -rf /tmp/json-image-<style>-<ratio>
```

### Step 5: Report

Summarize the results:
- Style name and aspect ratio
- Number of images generated
- Output directory path
- List of generated files with sizes

## Error Handling

- **Empty cases array**: Report that the style has no example cases for the requested ratio, list available ratios from `example_cases.json`
- **Style not found**: List available styles from `styles/` directory
- **Image-gen failure**: Report which case failed and preserve the temporary prompt files for debugging
- **Missing template/cases file**: Report the missing file path and suggest checking the style directory structure

## Constraints

- `IMAGE_GEN` must use the absolute path `/home/node/.claude/skills/image-gen/scripts/generate.ts`
- Use `set -euo pipefail` in all bash commands for fail-fast behavior
- Use `export` for variables accessed inside `xargs` subprocesses
- Never use serial + sleep loops for batch generation
- Always probe first before running the full batch
- Delete temporary files after successful generation (preserve them on failure for debugging)
- Output images are always PNG format
- Never pass `--aspect-ratio` as a CLI flag to image-gen when using GPT Image 2 (the ratio is embedded in the prompt metadata table instead)
