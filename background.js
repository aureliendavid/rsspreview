function detectFeed(event) {
  // force application/rss+xml to text/xml so the browser displays it instead of downloading
  let isfeed = false;

  for (let header of event.responseHeaders) {
    if (header.name.toLowerCase() == 'content-type') {
      header.value = header.value.replace(
        /application\/(rss|atom)\+xml/,
        'text/xml'
      );
      isfeed = true;
      break;
    }
  }

  if (isfeed) {
    for (let i = 0; i < event.responseHeaders.length; i++) {
      if (event.responseHeaders[i].name.toLowerCase() == 'cache-control') {
        event.responseHeaders.splice(i, 1);
        break;
      }
    }

    // don't cache requests we modified
    // otherwise on reload the content-type won't be modified again
    event.responseHeaders.push({
      name: 'Cache-Control',
      value: 'no-cache, no-store, must-revalidate',
    });
  }

  return { responseHeaders: event.responseHeaders };
}

const browser = window.browser || window.chrome;

browser.webRequest.onHeadersReceived.addListener(
  detectFeed,
  { urls: ['<all_urls>'], types: ['main_frame'] },
  ['blocking', 'responseHeaders']
);


function handleMessage(request, sender, sendResponse) {

  let popup = new URL(browser.runtime.getURL('popup/popup.html'));
  popup.searchParams.set('feeds', JSON.stringify(request));

  browser.pageAction.setPopup( {tabId: sender.tab.id, popup: popup.toString() });
  browser.pageAction.show(sender.tab.id);

  //sendResponse({response: "Response from background script to tab " + sender.tab.url , id: sender.tab.id });
}

browser.runtime.onMessage.addListener(handleMessage);
