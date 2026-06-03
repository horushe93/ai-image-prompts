# AI Image Prompts

A curated collection of structured, JSON-based AI image generation prompt templates. Each style defines a reusable visual language — composition rules, color palettes, typography, lighting, and material textures — encoded as a parameterized JSON template with swappable environment variables.

## How It Works

```
prompt-template.json   +   example_cases.json   →   rendered prompts   →   generated images
```

1. **`prompt-template.json`** defines a visual style with named `environment_variables` as placeholders.
2. **`example_cases.json`** provides concrete values for those variables across multiple cases, each producing a distinct composition.
3. The assemble script merges them into Markdown prompt files.
4. An image generation backend (Replicate GPT Image 2 or Gemini Nano Banana) renders the final previews.

## Project Structure

```
styles/
└── <style-name>/
    ├── prompt-template.json    # The visual style blueprint
    ├── example_cases.json      # Case-specific variable values
    └── preview/                # Generated preview images
        ├── 1_1/                # Square
        ├── 3_2/                # Landscape
        ├── 2_3/                # Portrait
        ├── 9_16/               # Vertical
        └── 16_9/               # Widescreen
```

## Available Styles

| Style | Description |
|---|---|
| **404-Renaissance** | Museum-grade digital pop-surrealist collage fusing classical art with retro digital decay |
| **digital-editorial-collage** | Editorial layout with mixed-media collage, grid-based typography, and tactile paper textures |
| **duotone-bento-box-brutalist-poster** | Brutalist poster design with duotone color treatment and bento-box grid layouts |
| **magnet-photography** | Magnetic, high-contrast photography with dramatic lighting and editorial composition |
| **minimalist-grid-swiss-typography** | Clean Swiss design with rigid grid systems, flush-left typography, and minimalist layouts |
| **punk-travel-zine-cutout-collage** | Punk zine aesthetic with cutout collage, distressed textures, and travel-themed compositions |
| **radical-pop-surrealist** | Radical pop-surrealist portrait collage with vivid colors and unexpected juxtapositions |
| **swiss-typographic-collage-biography** | Swiss typographic system applied to biographical collage with structured hierarchy |
| **vintage-newsprint-series-poster** | Vintage newspaper poster series with hot-metal typesetting, distressed ink, and rigid Swiss grids |
| **vintage-travelogue** | Vintage travel journal aesthetic with nostalgic color grading, aged paper textures, and journal layouts |

## Usage

### Prerequisites

- Node.js 20+
- Access to an image generation backend (Replicate API or Google Gemini API)

### Generating Preview Images

Use the `json-image` skill with Claude Code:

```
/json-image <style-name> <aspect-ratio>
```

**Examples:**

```bash
# Generate 3:2 previews for magnet-photography using default GPT Image 2
/json-image magnet-photography 3:2

# Generate 16:9 previews with Gemini Nano Banana 2
/json-image digital-editorial-collage 16:9 --channel gemini --model nano-banana-2
```

Supported aspect ratios: `1:1`, `3:2`, `2:3`, `4:3`, `9:16`, `16:9`

### Adding a New Style

1. Create a directory under `styles/<your-style-name>/`
2. Add a `prompt-template.json` with your visual style definition and `environment_variables`
3. Add an `example_cases.json` with one or more case arrays keyed by aspect ratio (e.g., `example_cases_3_2`)
4. Run `json-image` to generate previews

### Template Format

**`prompt-template.json`:**
```json
{
  "style_name": "Your style name",
  "style_summary": "A concise description of the visual language...",
  "environment_variables": {
    "VARIABLE_NAME": "default value"
  },
  "composition": { ... },
  "typography": { ... },
  "color_palette": { ... },
  "visual_direction": { ... }
}
```

**`example_cases.json`:**
```json
{
  "example_cases_3_2": [
    {
      "case_name": "Case Title",
      "environment_variables": {
        "VARIABLE_NAME": "specific value"
      }
    }
  ]
}
```

## License

MIT © 2026 [horushe](https://github.com/horushe93)
