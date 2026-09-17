# SetOnce

A Chrome extension that applies your saved cookie consent choices automatically, on every site — so the banners never get the chance to show up.

Set your preference once (Accept All, Reject All, or a custom mix of categories), and SetOnce submits it for you the moment each page loads, through that site's own consent system. No more clicking through the same popup ten times a week.

## Table of contents

- [Installation](#installation)
- [How it works](#how-it-works)
- [History](#history)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)

## Installation

No coding knowledge needed — just follow these steps in order. This installs the extension in Chrome's "Developer mode," since it isn't published on the Chrome Web Store.

### 1. Download the code

Click the green **`<> Code`** button at the top of this repository, then click **Download ZIP**. It'll save to your computer, usually into your **Downloads** folder.

### 2. Unzip it

- **Mac:** double-click the ZIP file — it extracts automatically into a folder next to it.
- **Windows:** right-click the ZIP file → **Extract All** → choose a location → **Extract**.

You should end up with a regular folder containing `manifest.json`, `popup.html`, and the other files from this repo. Keep this folder somewhere permanent (like Documents), not in Downloads — Chrome reads the extension from this exact location every time it runs.

### 3. Open Chrome's extensions page

Click the three-dot menu (top right of Chrome) → **Extensions** → **Manage Extensions**, or just type this into the address bar:

```
chrome://extensions
```

### 4. Turn on Developer mode

Flip the **Developer mode** toggle in the top-right corner of that page. A few new buttons will appear.

### 5. Load the extension

1. Click **Load unpacked**
2. Select the folder you unzipped in step 2 (the folder itself, the one directly containing `manifest.json` — not a folder that wraps around it)
3. Click **Select Folder** / **Open**

### 6. Done

The extension icon appears in your Chrome toolbar (click the puzzle-piece icon and pin it if you don't see it). Click it, set your cookie preferences, and you're set — it works automatically from here on.

## How it works

- On each page load, the content script checks for known consent management platforms: **OneTrust**, **Cookiebot**, **Didomi**, and the **IAB TCF API** used by Quantcast Choice and others.
- If it finds one, it calls that platform's own consent function directly, submitting your saved preference for real — the same as if you'd clicked through yourself.
- If no known platform is detected, it falls back to scanning the page for buttons with plain text like "Accept All" or "Reject All" and clicks the matching one.
- It watches the page for 20 seconds after load, since some banners render late.

## History

The extension popup has a **History** tab listing every site it's acted on — the time, the choice applied, and which method caught the banner. Search by site name, or clear the whole log with one click.

The log stays entirely on your own computer, in the extension's local storage. Nothing is sent anywhere. It caps at the 500 most recent entries.

## Limitations

- No method catches every banner — sites change their code, and some banners sit inside iframes the extension can't reach.
- Custom per-category choices (functional / analytics / marketing) work fully for Cookiebot and Didomi. For OneTrust, the built-in per-category logic is a stub — "Custom" mode currently falls back to whatever OneTrust's own save button does.
- "Reject All" is more reliable than fine-grained category picks, since more sites expose a single reject button than a full consent API.
- Turning the extension off (checkbox in the popup) restores normal banners immediately.

## Troubleshooting

**"Manifest file is missing or unreadable"**
Chrome couldn't find `manifest.json` where it expected. Make sure you selected the folder that *directly* contains `manifest.json` — sometimes unzipping creates a folder-inside-a-folder, in which case select the inner one.

**The extension disappeared after restarting Chrome**
Don't move or delete the unzipped folder after installing. If you did move it, repeat the "Load unpacked" step and point it at the new location.

**Chrome shows a "Developer mode extensions" warning**
Expected and normal — Chrome shows this for any extension not installed from the Web Store. It doesn't indicate a problem.
