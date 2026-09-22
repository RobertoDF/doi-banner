# DOI Banner

Paste a DOI, get a transparent citation banner for your slides.

**→ https://robertodf.github.io/doi-banner/**

![Card banner for Keypoint-MoSeq, Nature Methods 2024](docs/example-card.png)

![Footer strip for the same paper](docs/example-strip.png)

*Both generated from `10.1038/s41592-024-02318-2`, shown here on a dark plate —
the exported PNGs have a fully transparent background.*

Built for talks: instead of pasting a screenshot of a paper's title page, drop a
clean banner with the title, first authors, journal, year and a QR code that
links straight to the DOI.

## What it does

- Looks up metadata from **Crossref**, falling back to **DataCite** and
  `doi.org` content negotiation.
- Renders two shapes:
  - **Card** — 1800 px wide, for a title slide or a section divider.
  - **Footer strip** — a thin credit for the bottom of a slide.

  Both are sized to their content, so there is no dead space around the text.
- Exports **PNG** (at 2×, so it stays crisp on a projector) or **SVG**. The
  preview backdrop is what you get: transparent, dark or light.
  Picking a dark or light backdrop flips the text colour to match.
- Everything runs in the browser. Nothing is uploaded, no build step, no
  dependencies to install.

## Options

| Control | Notes |
| --- | --- |
| Text | White for dark slides, near-black for light ones. |
| Typeface | Humanist sans, serif, grotesk or mono — all system fonts. |
| Accent | The rule beside the text. Presets plus a colour picker. |
| QR to DOI | Optional. Add a white plate if your audience scans with Android — inverted QR codes are not universally readable. |
| Edit text | Every field is editable if the publisher's metadata is wrong or too long. |

## Deep links

Append a DOI to the URL and the banner is built on load:

```
https://robertodf.github.io/doi-banner/#10.1038/s41592-024-02318-2
```

## Notes

- SVG export references fonts **by name**, so it will only look identical on a
  machine that has them. For sharing, PNG is the safe format.
- QR generation uses [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
  by Kazuhiko Arase (MIT), vendored in `vendor/`.

## Running locally

```bash
git clone https://github.com/RobertoDF/doi-banner.git
cd doi-banner
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Licence

MIT.
