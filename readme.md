## Overview

Chrome extension for easily enabling / disabling JavaScript for individual domains.

## Installation

Clone the repo **with submodules**. Without `--recurse-submodules`, the main functionality will work, but the extension's "options" page won't.

```sh
git clone --recurse-submodules --shallow-submodules https://github.com/mitranim/chrome-extension-nojs.git
```

- Goto [`chrome://extensions`](chrome://extensions).
- Click "Load unpacked extension" → select repo directory.

## Usage

Chrome toolbar → extension → left click → toggle JS for current domain.

Alt+Shift+J = same as above.

Chrome menu → Extensions → Manage extensions → Keyboard shortcuts → reassign hotkey above.

Chrome toolbar → extension → right click → view extension-managed per-domain JS settings.
