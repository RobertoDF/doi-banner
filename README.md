# DOI / Link Banner

Paste a DOI or web link — or a whole list of them — and get a transparent resource banner for your slides.

**→ https://robertodf.github.io/doi-banner/**

![Card banner for Keypoint-MoSeq, Nature Methods 2024](docs/example-card.png)

![Footer strip for the same paper](docs/example-strip.png)

*Both generated from `10.1038/s41592-024-02318-2`, shown here on a dark plate —
the exported PNGs have a fully transparent background.*

Built for talks: use the same visual treatment for papers and web resources. DOI inputs resolve publication metadata automatically; ordinary links become editable resource cards with a QR code pointing to the target URL.

## What it does

- DOI inputs look up metadata from **Crossref**, falling back to **DataCite** and `doi.org` content negotiation.
- Generic `http(s)` links are accepted directly, rendered locally, and remain fully editable. This avoids depending on a CORS/proxy service for arbitrary webpages.
- Renders two shapes:
  - **Card** — 1800 px wide, for a title slide or a section divider.
  - **Footer strip** — a thin one-line credit (authors, journal, year, DOI)
    for the bottom of a slide you have already titled.

  Both are sized to their content, so there is no dead space around the text.
- Takes **several resources at once**, including mixed DOI + URL lists. Paste one per line and they come back
  stacked into a single image — handy for a references slide or a
  “building on” slide. Up to 12 per run; a DOI that fails to resolve is
  reported and the rest are still drawn.
- Exports **PNG** (at 2×, so it stays crisp on a projector) or **SVG**, or
  **copies the PNG** to the clipboard for pasting into Keynote, Google Slides and other apps. The
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
| QR to target | Optional. For DOI resources it points to `doi.org`; for links it points directly to the supplied URL. Add a white plate if your audience scans with Android — inverted QR codes are not universally readable. |
| Edit text | Every field is editable if the publisher's metadata is wrong or too long. With several DOIs loaded, these fields edit the first paper. |

## Deep links

Append a DOI or URL to the hash and the banner is built on load:

```
https://robertodf.github.io/doi-banner/#10.1038/s41592-024-02318-2
```

For multiple or mixed resources, the app stores the encoded list in the hash.
Query parameters work too: `?doi=10.1038/s41592-024-02318-2` or `?target=https://…` (repeat
them for several resources).

```
https://robertodf.github.io/doi-banner/#https%3A%2F%2Felixir-europe.github.io%2Fds-handbook%2F
```

## Notes

- SVG export references fonts **by name**, so it will only look identical on a
  machine that has them. For sharing, PNG is the safe format.
- QR generation uses [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
  by Kazuhiko Arase (MIT), vendored in `vendor/`.

## PowerPoint add-in

The same app also runs as a PowerPoint task pane
(`addin.html`, served from GitHub Pages). It has the same controls as the website and adds
**Insert into slide**. The banner goes in as SVG when the host supports it
(`ImageCoercion 1.2`), or as a transparent PNG otherwise. The pane's preview defaults to
*Transparent*, so inserted banners keep a see-through background.

Install it by sideloading [`manifest.xml`](manifest.xml):

- **PowerPoint for Mac** — copy the manifest into the add-in folder, then restart PowerPoint:
  ```bash
  mkdir -p ~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef
  cp manifest.xml ~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/
  ```
  Open it from **Home → DOI Banner** (or **Insert → Add-ins → My Add-ins**).
- **PowerPoint for Windows** — put `manifest.xml` in a folder and share it on the network,
  for example `\\MACHINE\addins`. In PowerPoint, go to **File → Options → Trust Center → Trust Center Settings →
  Trusted Add-in Catalogs**. Add that UNC path, tick **Show in Menu**, and restart PowerPoint. Then go to
  **Insert → My Add-ins → Shared Folder** and pick *DOI / Link Banner*.
- **PowerPoint on the web** — go to **Insert → Add-ins → My Add-ins → Upload My Add-in**
  (on some tenants: **Manage My Add-ins**). Choose `manifest.xml`.

To test changes before they reach GitHub Pages, serve the repo over HTTPS and point
`SourceLocation` and the `Taskpane.Url` resource in a local copy of the manifest at your URL.
Opened in a normal browser, `addin.html` still renders and downloads, but
*Insert into slide* is disabled.

The add-in needs PowerPoint for Microsoft 365 or 2021+ on Windows, PowerPoint for Mac, or
PowerPoint on the web. Older Windows builds that host add-ins in Internet Explorer show a
"not supported" notice. It asks only for `WriteDocument` permission and never reads the
presentation.

**Microsoft Marketplace.** Store assets (logo, screenshots, listing text, reviewer notes) and a
step-by-step Partner Center guide are in [`store/`](store/SUBMISSION.md). The public
[privacy policy](https://robertodf.github.io/doi-banner/privacy.html),
[terms](https://robertodf.github.io/doi-banner/terms.html) and
[support](https://robertodf.github.io/doi-banner/support.html) pages are served from this repo.

## Keynote

Keynote has no add-in or plugin API. Instead, use the clipboard and a small AppleScript:

1. On the website, click **Copy image**. This copies the PNG at download resolution (2×), with a
   transparent background if *Transparent* is selected. If the browser can't copy images, it
   downloads the PNG instead.
2. Press your keyboard shortcut. [`keynote/insert-banner.applescript`](keynote/insert-banner.applescript)
   places the clipboard image on the current slide of the front Keynote document. It is centred,
   near the bottom, and about 80% of the slide width. If Keynote isn't open, no presentation is
   open, or there is no image on the clipboard, it shows a dialog.

You can also just paste (⌘V) into Keynote. The script saves you resizing and positioning the image.

### Install as a Shortcut (recommended)

1. Open **Shortcuts** and create a new shortcut, for example *Insert DOI Banner*.
2. Add a **Run AppleScript** action, and replace its contents with the contents of
   `keynote/insert-banner.applescript`.
3. In the shortcut's details (ⓘ), turn on **Use as Quick Action** / **Pin in Menu Bar** if you
   want them, and click **Add Keyboard Shortcut** (for example ⌃⌥⌘B).
4. On the first run, macOS asks whether Shortcuts may control Keynote. Click **OK**. If you
   denied it earlier, turn it on under **System Settings → Privacy & Security → Automation →
   Shortcuts → Keynote**.

### Or install in the Script Menu

```bash
mkdir -p ~/Library/Scripts/Applications/Keynote
osacompile -o ~/Library/Scripts/Applications/Keynote/"Insert DOI Banner.scpt" keynote/insert-banner.applescript
```

Turn on the menu under **Script Editor → Settings → General → Show Script menu in menu bar**.
The script then appears in the menu bar whenever Keynote is in front. The Script Menu can't
assign a keyboard shortcut, so use the Shortcuts route if you want one. Automation permission
is granted in the same way, under the **Script Menu** (or `osascript`) entry.

### Optional: “New banner from DOI” shortcut

In Shortcuts, create a shortcut with three actions: **Ask for Input** (Text, prompt “DOI or link”) →
**URL Encode** → **Open URLs** with
`https://robertodf.github.io/doi-banner/?doi=` followed by the *URL Encoded Text* variable.
The site opens with the banner already built. Click **Copy image**, then run *Insert DOI Banner*.

The site accepts `?doi=…` and `?target=…` (repeatable, for several resources) as well as
the `#…` deep links described above.

## Running locally

```bash
git clone https://github.com/dhuzard/doi-link-banner.git
cd doi-link-banner
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Licence

MIT. See also the [terms of use](https://robertodf.github.io/doi-banner/terms.html) and
[privacy policy](https://robertodf.github.io/doi-banner/privacy.html): no data is collected.
