# Submitting DOI / Link Banner to Microsoft Marketplace (AppSource)

A step-by-step guide to publishing the PowerPoint add-in through
[Partner Center](https://partner.microsoft.com/dashboard). Field values to paste are in
[`listing.md`](listing.md).

Sources, checked October 2026:

- [Publish your Office Add-in to Microsoft Marketplace](https://learn.microsoft.com/partner-center/marketplace-offers/submit-to-appsource-via-partner-center)
- [Checklist for submitting your Office and Teams apps](https://learn.microsoft.com/partner-center/marketplace-offers/checklist)
- [Commercial marketplace certification policies, 1100 and 1120](https://learn.microsoft.com/legal/marketplace/certification-policies#1120-office-add-ins)
- [Make your solutions available in Microsoft Marketplace (Office add-ins)](https://learn.microsoft.com/office/dev/add-ins/publish/publish)

---

## 0. Before you start

- [ ] This PR is merged into `master` and GitHub Pages has redeployed. These must all return **200**:
  ```sh
  for p in addin.html privacy.html terms.html support.html \
           assets/icon-16.png assets/icon-32.png assets/icon-64.png assets/icon-80.png; do
    printf '%-22s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://robertodf.github.io/doi-banner/$p"
  done
  ```
- [ ] `npx --yes office-addin-manifest validate manifest.xml` prints **“The manifest is valid.”**
- [ ] Sideload `manifest.xml` and run the reviewer test steps from `listing.md` yourself in
  **PowerPoint on the web**, **PowerPoint for Windows** and **PowerPoint for Mac**. See the README section
  *PowerPoint add-in → Sideloading*. Reviewers reject add-ins that fail on any platform listed in the manifest.
- [ ] `<ProviderName>` in `manifest.xml` (**Roberto De Filippo**) must exactly match the publisher display name
  you use in Partner Center. If it differs, change the manifest, bump `<Version>` and re-validate.
- [ ] Do **not** change `<Id>` (`11bfdd48-2c7d-454e-9fb4-ba0abe3bc29e`). It identifies the add-in for all
  future updates.

## 1. Join the Microsoft 365 and Copilot program

1. Go to [Partner Center](https://partner.microsoft.com/dashboard) and sign in with a **work or school
   (Microsoft Entra) account**. Personal Microsoft accounts cannot publish. If you have no organisation
   tenant, Partner Center offers to create one during sign-up.
2. Open **Account settings → Programs** (or *Settings → Account settings → Programs*) and choose
   **Microsoft 365 and Copilot** (formerly *Office Store / Microsoft 365 and Copilot program*) → **Get started**.
3. Fill in the publisher profile:
   - **Publisher display name**: `Roberto De Filippo`. This must match `ProviderName`.
   - **Account type**: *Individual* or *Company*. Individual is fine for a personal open-source project.
     Company accounts need business verification.
   - Contact email, address and phone. Microsoft uses these for certification messages; they are not shown on the listing.
4. Accept the **Microsoft Publisher Agreement** and submit. Account verification (email and, for companies,
   business details) can take from a few hours to several days. Watch for the verification email.
5. Payout and tax profiles are **not** needed, because the add-in is free.

## 2. Create the Office add-in offer

1. In Partner Center open **Marketplace offers** and choose the **Microsoft 365 and Copilot** tab.
2. Click **+ New offer → Office add-in**.
3. **Name**: `DOI / Link Banner`. Click *Check availability*; the name must be unique in the store.
   Choose the publisher if prompted, then **Create**.

## 3. Product setup

On the *Product setup* page:

| Question | Answer |
|---|---|
| Does your add-in have a mobile / Apple App Store listing? | **No** |
| Microsoft Entra ID / single sign-on (SSO)? | **No** (no sign-in) |
| Does your add-in require additional purchases? | **No**. Free, no in-app purchases |
| Microsoft 365 certification / Publisher attestation | Optional. Can be done after publishing |

Save.

## 4. Packages — upload the manifest

1. **Packages → Upload** and select `manifest.xml` from the repository root.
2. Partner Center re-runs the same validator. Fix any errors it shows, bump `<Version>`, and upload again.
3. It lists the detected hosts and platforms: *PowerPoint on the web, Windows and Mac*, plus iPad if
   offered. Leave **iPad** unchecked unless you have tested on an iPad, because reviewers would then test
   it there too.

## 5. Properties

| Field | Value |
|---|---|
| Category | **Productivity** (primary), **Education** (secondary) |
| Industries (if shown) | Optional: *Education* |
| Legal / End-user licence agreement | Choose **Use the Standard Contract for Microsoft's commercial marketplace** (simplest), *or* paste `https://robertodf.github.io/doi-banner/terms.html` |
| Privacy policy URL | `https://robertodf.github.io/doi-banner/privacy.html` |
| Help / Support URL | `https://robertodf.github.io/doi-banner/support.html` |

Save.

## 6. Marketplace listings

1. **Manage additional languages**: keep **English (United States)** only.
2. Open the English listing and fill it from `listing.md`:
   - **Name**: `DOI / Link Banner`
   - **Summary**: the 77-character summary
   - **Description**: the long description, plain text with “•” bullets
   - **Search keywords**: up to the listed terms
   - **Privacy / Support / Help URLs**: as above
   - **Logo**: `store/logo-300.png` (300×300 PNG)
   - **Screenshots**: upload `store/screenshots/1280x720/01…04-*.png` in order, with the captions from
     `listing.md`. Partner Center wants 1280×720 PNGs; the 1366×768 originals are kept in `store/screenshots/`.
   - **Video**: optional, can be left empty.
3. Save.

## 7. Availability

- **Markets**: *Select all*.
- **Visibility**: *Public*.
- **Release**: *As soon as possible* after certification. Choose a date only if you want to delay it.

## 8. Notes for certification

Paste the **Notes for certification** block from `listing.md`. It gives the exact steps: open the pane, paste
`10.1038/s41592-024-02318-2`, click **Fetch**, click **Insert into slide**. It also states that no account or
test credentials are needed.

## 9. Review and publish

1. Click **Review and publish**. Resolve anything marked *incomplete*.
2. Submit. You can follow progress on the offer's **Overview** page:
   *Automated validation → Certification → Publish*.
3. Microsoft emails a certification report. Typical turnaround is a few days, up to **4–6 weeks**. If it
   fails, the report cites the policy number (for example 1120.x) with screenshots. Fix the issue, bump
   `<Version>` in `manifest.xml` (for example `1.1.0.0 → 1.1.1.0`), re-upload under **Packages**, and resubmit.
4. Once live, the add-in appears in **Home → Add-ins → Get Add-ins** in PowerPoint and on
   Microsoft Marketplace (formerly AppSource).

## Updating later

- **Web code only** (HTML/JS/CSS on GitHub Pages): no resubmission needed; users get it on next load.
  Keep behaviour consistent with the listing (policy 1100.6).
- **Manifest changes** (icons, URLs, permissions, ribbon, requirement sets): bump `<Version>`, re-upload,
  and resubmit. This goes through certification again.

## What reviewers check (1120 summary) and how this add-in meets it

| Requirement | Status |
|---|---|
| Works on every platform the manifest allows (web, Windows, Mac) | Uses only `setSelectedDataAsync` with `ImageCoercion` 1.1 (PNG), and 1.2 (SVG) only when `isSetSupported`. **Needs a manual run on all three before submitting.** |
| Older Windows webviews (IE11 / Trident in perpetual Office 2016–2019) | The pane detects Trident and shows a clear “not supported, use Microsoft 365 / 2021+ / Mac / web” message instead of failing silently |
| Latest hosted `office.js` | `https://appsforoffice.microsoft.com/lib/1/hosted/office.js` |
| Valid SupportUrl, high-resolution icon, incremented version | `support.html`, `icon-64`, `1.1.0.0` |
| Add-in commands (ribbon button) | Home tab → *DOI Banner* |
| Least privilege | `WriteDocument` (previously `ReadWriteDocument`); the add-in never reads the document |
| No unexpected document changes | Writes only when the user clicks **Insert into slide** |
| Errors handled gracefully | Fetch and insert errors appear in the status line with a hint; outside Office the Insert button is disabled with a tooltip |
| 320 px task pane, touch | Single column, no horizontal scroll at 320 px, 26 px+ swatches and 32 px+ buttons; Insert is the primary full-width action |
| HTTPS throughout; no pop-ups without user action | All URLs are https; external links open only on click |
| Privacy / terms / support pages | `privacy.html`, `terms.html`, `support.html` |

## Regenerating store assets

- **Logo**: `store/logo-300.png` is drawn with Pillow in the same style as `assets/icon-*.png`.
- **Screenshots**: serve the repo root (`python3 -m http.server 8767`), open
  `http://localhost:8767/store/mock/powerpoint.html` at 1366×768 in Playwright, stub
  `**/hosted/office.js` with an empty script (Office.js blanks iframes outside Office), drive the pane
  inside the iframe, call `insertFromPane()`, and screenshot. Resize to 1280×720 for Partner Center.
