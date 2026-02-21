#!/usr/bin/env node
/**
 * Integration Tests for RSSPreview
 *
 * Usage:
 *   npm test
 *
 * Requires: geckodriver, selenium-webext-bridge
 */

const http = require('http');
const path = require('path');
const {
  launchBrowser, cleanupBrowser,
  sleep, waitForCondition, TestResults
} = require('selenium-webext-bridge');

const EXT_DIR = __dirname;
const EXT_ID = '{7799824a-30fe-4c67-8b3e-7094ea203c94}';
const PORT = 8080;
const BASE = `http://127.0.0.1:${PORT}`;

// Test server setup

const RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS Feed sample</title>
    <link>${BASE}</link>
    <description>A test feed for integration testing</description>
    <item>
      <title>Test Article 1</title>
      <link>${BASE}/article-1</link>
      <description>First test article description</description>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Test Article 2</title>
      <link>${BASE}/article-2</link>
      <description>Second test article description</description>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed sample</title>
  <link href="${BASE}" rel="alternate"/>
  <id>urn:uuid:test-atom-feed</id>
  <updated>2024-01-01T00:00:00Z</updated>
  <entry>
    <title>Atom Entry 1</title>
    <link href="${BASE}/atom-entry-1" rel="alternate"/>
    <id>urn:uuid:atom-entry-1</id>
    <updated>2024-01-01T00:00:00Z</updated>
    <summary>First atom entry summary</summary>
  </entry>
</feed>`;

const SECOND_RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Second RSS Feed</title>
    <link>${BASE}</link>
    <description>Another test feed</description>
    <item>
      <title>Second Feed Article</title>
      <link>${BASE}/second-article</link>
      <description>An article from the second feed</description>
    </item>
  </channel>
</rss>`;

function htmlPage(title, headExtra = '') {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  ${headExtra}
</head>
<body>
  <h1>${title}</h1>
  <p>Test page content.</p>
</body>
</html>`;
}

function createRssTestServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = req.url.split('?')[0];

      switch (url) {
        case '/page-with-rss':
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlPage('Page has an RSS feed',
            `<link rel="alternate" type="application/rss+xml" title="Test RSS Feed" href="/feed.rss">`
          ));
          break;

        case '/page-with-multiple-feeds':
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlPage('Page has many feeds', [
            `<link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.rss">`,
            `<link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/feed.atom">`,
            `<link rel="alternate" type="application/rss+xml" title="Second RSS Feed" href="/feed2.rss">`,
          ].join('\n  ')));
          break;

        case '/page-without-feeds':
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlPage('Page has no feeds'));
          break;

        case '/feed.rss':
          res.writeHead(200, { 'Content-Type': 'application/rss+xml' });
          res.end(RSS_FEED);
          break;

        case '/feed2.rss':
          res.writeHead(200, { 'Content-Type': 'application/rss+xml' });
          res.end(SECOND_RSS_FEED);
          break;

        case '/feed.atom':
          res.writeHead(200, { 'Content-Type': 'application/atom+xml' });
          res.end(ATOM_FEED);
          break;

        default:
          // Used for test bridge init/reset.
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlPage('Test Page'));
          break;
      }
    });

    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Test server running on ${BASE}`);
      resolve(server);
    });
  });
}

// Integration Tests: main function
async function main() {
  console.log('===== Integration Tests =====');

  const results = new TestResults();
  const server = await createRssTestServer();
  let browser;

  try {
    browser = await launchBrowser({
      extensions: [EXT_DIR],
      firefoxArgs: ['-remote-allow-system-access'],
    });
    const { driver, testBridge: bridge } = browser;
    let extBaseUrl;

    try {
      extBaseUrl = await bridge.getExtensionUrl(EXT_ID);
      if (extBaseUrl && extBaseUrl.startsWith('moz-extension://')) {
        results.pass('Get extension URL');
      } else {
        results.fail('Get extension URL', `got: ${extBaseUrl}`);
      }
    } catch (e) {
      results.error('Get extension URL', e);
    }

    console.log('----- Options Page -----')

    try {
      await driver.get(`${extBaseUrl}/settings/options.html`);
      await sleep(1500);

      const structure = await driver.executeScript(() => {
        return {
          doDetect: !!document.getElementById('doDetect'),
          newTab: !!document.getElementById('newTab'),
          preventPreview: !!document.getElementById('preventPreview'),
          orangeIcon: !!document.getElementById('orangeIcon'),
        };
      });

      if (structure.doDetect && structure.newTab && structure.preventPreview && structure.orangeIcon) {
        results.pass('Options page contains expected elements');
      } else {
        results.fail('Options page contains expected elements', JSON.stringify(structure));
      }
    } catch (e) {
      results.error('Options page contains expected elements', e);
    }

    console.log('----- Page Actions -----');

    await bridge.reset();
    try {
      await driver.get(`${BASE}/page-with-rss`);
      await sleep(3000); // Wait for detection (background process)

      await bridge.clickPageAction(EXT_ID);
      await sleep(500);

      results.pass('Page action appears on page with RSS feed');
    } catch (e) {
      if (e.message.includes('Page action button not found')) {
        results.fail('Page action appears on page with RSS feed', e.message);
      } else {
        results.error('Page action appears on page with RSS feed', e);
      }
    }

    await bridge.reset();
    try {
      await driver.get(`${BASE}/page-without-feeds`);
      await sleep(3000);

      let found = false;
      try {
        await bridge.clickPageAction(EXT_ID);
        found = true;
      } catch (e) {
        if (!e.message.includes('Page action button not found')) {
          throw e;
        }
      }

      if (!found) {
        results.pass('No page action on page without feeds');
      } else {
        results.fail('No page action on page without feeds', 'page action was clickable');
      }
    } catch (e) {
      results.error('No page action on page without feeds', e);
    }

    console.log('----- Feed Display -----');

    await bridge.reset();
    try {
      // Pass tab to the popup page.
      const activeTab = await bridge.getActiveTab();
      const feeds = { [`${BASE}/feed.rss`]: 'RSS Feed Sample' };
      const popupUrl = `${extBaseUrl}/popup/popup.html?tabId=${activeTab.id}&feeds=${encodeURIComponent(JSON.stringify(feeds))}`;

      await driver.get(popupUrl);
      await sleep(1500);

      const feedItems = await driver.executeScript(() => {
        const items = document.querySelectorAll('.panel-list-item');
        return Array.from(items).map(item => ({
          text: item.querySelector('.text')?.innerText,
          href: item.getAttribute('data-href'),
        }));
      });

      if (feedItems.length === 1 &&
          feedItems[0].text === 'RSS Feed Sample' &&
          feedItems[0].href.includes('/feed.rss')) {
        results.pass('Popup displays correct feed');
      } else {
        results.fail('Popup displays correct feed', JSON.stringify(feedItems));
      }
    } catch (e) {
      results.error('Popup displays correct feed', e);
    }

    // Test case for multiple feeds.
    try {
      await bridge.reset();
      const activeTab = await bridge.getActiveTab();
      const feeds = {
        [`${BASE}/feed.rss`]: 'RSS Feed',
        [`${BASE}/feed.atom`]: 'Atom Feed',
        [`${BASE}/feed2.rss`]: 'Second RSS Feed',
      };
      const popupUrl = `${extBaseUrl}/popup/popup.html?tabId=${activeTab.id}&feeds=${encodeURIComponent(JSON.stringify(feeds))}`;

      await driver.get(popupUrl);
      await sleep(1500);

      const count = await driver.executeScript(() => {
        return document.querySelectorAll('.panel-list-item').length;
      });

      if (count === 3) {
        results.pass('Popup displays all 3 feeds');
      } else {
        results.fail('Popup displays all 3 feeds', `found ${count}`);
      }
    } catch (e) {
      results.error('Popup displays all 3 feeds', e);
    }

    try {
      await bridge.reset();
      const activeTab = await bridge.getActiveTab();
      const feeds = { [`${BASE}/feed.rss`]: 'RSS Feed Sample' };
      const popupUrl = `${extBaseUrl}/popup/popup.html?tabId=${activeTab.id}&feeds=${encodeURIComponent(JSON.stringify(feeds))}`;

      await driver.get(popupUrl);
      await sleep(1500);

      // Clicking on the feed item should trigger a new tab.
      await driver.executeScript(() => {
        const item = document.querySelector('.panel-list-item');
        if (item) {
          item.click();
        }
      });
      await sleep(2000);

      // Need to reset bridge as we'd navigated away from it.
      await bridge.reset();
      const tabs = await bridge.getTabs();
      const feedTab = tabs.find(t => t.url && t.url.includes('/feed.rss'));

      if (feedTab) {
        results.pass('Clicking feed opens new tab');
      } else {
        results.fail('Clicking feed opens new tab',
          `tabs: ${JSON.stringify(tabs.map(t => t.url))}`);
      }
    } catch (e) {
      results.error('Clicking feed opens new tab', e);
    }

    await bridge.reset();
    await bridge.closeOtherTabsAndWindows();
    try {
      await driver.get(`${BASE}/feed.rss`);
      await sleep(4000); // XSL transformation delay

      const preview = await driver.executeScript(() => {
        return {
          hasBody: !!document.getElementById('rsspreviewBody'),
          hasFeedBody: !!document.getElementById('feedBody'),
          hasFeedTitle: !!document.getElementById('feedTitleText'),
          entryCount: document.querySelectorAll('.entry').length,
          title: document.title,
        };
      });

      if (preview.hasFeedBody && preview.hasFeedTitle && preview.entryCount === 2) {
        results.pass('RSS feed displays with CSS');
      } else {
        results.fail('RSS feed displays with CSS', JSON.stringify(preview));
      }
    } catch (e) {
      results.error('RSS feed displays with CSS', e);
    }

    try {
      await driver.get(`${BASE}/feed.atom`);
      await sleep(4000);

      const preview = await driver.executeScript(() => {
        return {
          hasFeedBody: !!document.getElementById('feedBody'),
          hasFeedTitle: !!document.getElementById('feedTitleText'),
          entryCount: document.querySelectorAll('.entry').length,
        };
      });

      if (preview.hasFeedBody && preview.hasFeedTitle && preview.entryCount === 1) {
        results.pass('Atom feed displays with CSS');
      } else {
        results.fail('Atom feed displays with CSS', JSON.stringify(preview));
      }
    } catch (e) {
      results.error('Atom feed displays with CSS', e);
    }

  } catch (e) {
    results.error('Test suite setup', e);
  } finally {
    if (browser) await cleanupBrowser(browser);
    server.close();
  }

  results.summary();
  process.exit(results.exitCode());
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
