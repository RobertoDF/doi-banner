# Marketplace listing — DOI / Link Banner (PowerPoint add-in)

Copy these fields into Partner Center → *Marketplace listings* → *English (United States)*.
Character counts include spaces.

## App name (≤ 50, 30 recommended)

```
DOI / Link Banner
```

17 characters. Must match `<DisplayName>` in `manifest.xml`. Under policy 1100.1 it has no Microsoft
brand words.

## Summary (≤ 100, 70 recommended)

```
Turn a DOI or link into a clean citation banner with QR code for your slides.
```

77 characters.

## Description (≤ 4,000; 300–500 words recommended)

```
DOI / Link Banner puts a clean, readable reference on your slide in a few seconds. Paste a DOI or a web link, click Fetch, then click Insert into slide. The add-in looks up the title, authors, journal, year, volume and pages, lays them out as a compact banner with a scannable QR code, and inserts it at your current selection.

Built for scientists, students and anyone who cites papers in talks, lectures, journal clubs, posters and lab meetings. The audience can scan the QR code to open the paper on their phone, and the banner stays legible at the back of the room.

What you can do
• Cite any DOI. Metadata comes from Crossref, with DataCite and doi.org as fallbacks, so papers, preprints and datasets all work.
• Link anything else. Paste a URL (a GitHub repository, a lab website, a dataset portal) and get a banner with a title, the site name and a QR code.
• Stack several references. Put one DOI or link per line to build a single banner that lists them all.
• Two shapes. A card with title, authors and journal for slides about one paper, or a slim footer strip for a running citation at the bottom of every slide.
• Match your deck. Near-black text for light slides, white text for dark slides, three typefaces and an accent colour.
• Edit before inserting. Fix a title, shorten the author list or add a journal abbreviation under Edit text.
• Transparent background. The banner sits on your slide design without a white box.
• Sharp at any size. Inserted as a vector (SVG) image where PowerPoint supports it, otherwise as a high-resolution transparent PNG.

How to use
1. On the Home tab, click DOI Banner to open the pane.
2. Paste a DOI (for example 10.1038/s41592-024-02318-2) or a link and click Fetch.
3. Choose shape and colours if you like, then click Insert into slide.

Privacy
No account and no sign-in. The add-in collects no personal data and uses no cookies or analytics. DOIs are sent only to the public Crossref and DataCite services to look up metadata; web links are not fetched at all, and QR codes are made inside the pane. The add-in only writes to your presentation when you click Insert into slide.

Free and open source under the MIT License: https://github.com/RobertoDF/doi-banner
```

About 370 words.

## Categories

Pick at most 3 in Partner Center; certification policy 100.3 recommends at most 2.

1. **Productivity** (primary)
2. **Education**

## Keywords / search terms

Policy 100.3: no competitor or category names, and not the app title.

```
DOI, citation, reference, QR code, Crossref, DataCite, journal club, academic, research paper, scientific poster
```

## URLs

All are https and served from GitHub Pages.

| Field | URL |
|---|---|
| Privacy policy | https://robertodf.github.io/doi-banner/privacy.html |
| Support / Help | https://robertodf.github.io/doi-banner/support.html |
| End-user licence (EULA) | Use **Microsoft Standard Contract**, *or* link https://robertodf.github.io/doi-banner/terms.html |
| Website / Learn more | https://robertodf.github.io/doi-banner/ |
| Source code | https://github.com/RobertoDF/doi-banner |

## Images

| Asset | File | Spec |
|---|---|---|
| Logo | `store/logo-300.png` | 300×300 PNG (Partner Center accepts 216–350 px square) |
| Screenshots (Partner Center) | `store/screenshots/1280x720/01…04-*.png` | 1280×720 PNG, 1–5 images |
| Screenshots (1366×768 originals) | `store/screenshots/01…04-*.png` | 1366×768 PNG |

Screenshot captions, ≤ 100 characters each:

1. `01-task-pane`: “Open DOI Banner from the Home tab and paste a DOI or link.”
2. `02-insert-doi-light-slide`: “Fetch the paper and insert a transparent citation card with QR code.”
3. `03-footer-strip-dark-slide`: “Footer strip with white text for dark slides.”
4. `04-web-link-edit-text`: “Works with any web link; edit the text before inserting.”

The screenshots use a mock PowerPoint window (`store/mock/powerpoint.html`) with the real task pane in an
iframe. To retake them with real PowerPoint once it is sideloaded, keep the 1280×720 size.

## Pricing and availability

- Free. No in-app purchases (“Does your add-in have additional purchases?” → **No**).
- Markets: all.
- No sign-in, no Microsoft Entra ID / SSO, no Apple App Store listing.

## Notes for certification

Paste into *Notes for certification*:

```
DOI / Link Banner — PowerPoint task-pane add-in. No account, sign-in, licence key or test credentials are needed. Free, no purchases.

Supported: PowerPoint on the web, PowerPoint for Windows (Microsoft 365 / 2021+) and PowerPoint for Mac. Requirement set: ImageCoercion 1.1. Permission: WriteDocument (used only to insert the image at the selection when the user clicks Insert into slide).

Test steps:
1. Open any presentation and select a slide in Normal view (click inside the slide).
2. On the Home tab, click "DOI Banner" (group "DOI Banner"). The task pane opens with an example banner.
3. Paste this DOI into the box at the top:  10.1038/s41592-024-02318-2
4. Click "Fetch". The status line says "Found via Crossref." and the preview shows "Keypoint-MoSeq: parsing behavior by linking point tracking to pose dynamics", Weinreb, Pearl, Lin et al., Nat Methods 21, 2024, with a QR code.
5. Click "Insert into slide". The banner is inserted on the current slide with a transparent background (as SVG where ImageCoercion 1.2 is available, otherwise PNG). The status line says "Inserted as SVG." or "Inserted as PNG.".

Optional checks:
- Web link: paste https://github.com/RobertoDF/doi-banner, click Fetch, then Insert into slide. Links are not fetched; a QR code and title are made locally.
- Options: change Shape to "Footer strip" and Text to "White – dark slides", then insert again.
- Error handling: paste 10.9999/does-not-exist and click Fetch. A readable error appears in the status line and the pane keeps working.
- Several references: paste two DOIs on separate lines and click Fetch to stack them in one banner.

Network: the pane calls api.crossref.org, api.datacite.org and doi.org (only for DOIs), and loads office.js from appsforoffice.microsoft.com. No other services, no cookies, no analytics.
Privacy: https://robertodf.github.io/doi-banner/privacy.html  Support: https://robertodf.github.io/doi-banner/support.html
```
