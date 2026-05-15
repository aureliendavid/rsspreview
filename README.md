# rsspreview

Firefox has removed support for RSS in versions 64+, including the useful preview feature.

This extension attempts to recreate it.

Download at: https://addons.mozilla.org/en-US/firefox/addon/rsspreview/

Additional features:
* feed detection and address bar button
* detect feeds from itunes podcast pages
* custom css support

## Integration Tests

The integration tests require installing packages via `npm` and the Firefox directory in your PATH.

Install test dependencies and run:

```bash
npm install
npm test
```

Alternately, run in headless mode:

```bash
HEADLESS=1 npm test
```
