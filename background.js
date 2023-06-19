function detectFeed(event) {

  if (event.statusCode == 301 || event.statusCode == 302)
    return { responseHeaders: event.responseHeaders };


  // force application/rss+xml to text/xml so the browser displays it instead of downloading
  let isfeed = false;

  for (let header of event.responseHeaders) {
    if (header.name.toLowerCase() == 'content-type') {
      if (header.value.match(/application\/((x-)?rss|atom)\+xml/)) {
        header.value = header.value.replace(
          /application\/((x-)?rss|atom)\+xml/,
          'text/xml'
        );
        isfeed = true;
      }
      break;
    }
  }

  if (isfeed) {

    var cache_idx = null;

    for (let i = 0; i < event.responseHeaders.length; i++) {
      if (event.responseHeaders[i].name.toLowerCase() == 'cache-control') {
        cache_idx = i;
      }
      else if (event.responseHeaders[i].name.toLowerCase() == 'content-security-policy') {

        try {
          let options = JSON.parse(localStorage.getItem('options'));

          if (options.enableCss && options.bypassCSP)
            event.responseHeaders[i].value = patchCSP(event.responseHeaders[i].value);
        }
        catch(e) {
          console.log(e);
        }
      }
    }

    if (cache_idx) {
      event.responseHeaders.splice(cache_idx, 1);
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
  browser.storage.sync.get({orangeIcon: false}).then(function(options){

    let popup = new URL(browser.runtime.getURL('popup/popup.html'));
    popup.searchParams.set('tabId', sender.tab.id.toString());
    popup.searchParams.set('feeds', JSON.stringify(request));

    if (options.orangeIcon) {
      browser.pageAction.setIcon({tabId: sender.tab.id, path: {
        "19": "icons/rss-19.png",
        "38": "icons/rss-38.png"
        }
      });
    }
    browser.pageAction.setPopup( {tabId: sender.tab.id, popup: popup.toString() });
    browser.pageAction.show(sender.tab.id);

    //sendResponse({response: "Response from background script to tab " + sender.tab.url , id: sender.tab.id });

  });
}

browser.runtime.onMessage.addListener(handleMessage);


function parseCSP(csp) {
  let res = {};

  let directives = csp.split(";");
  for (let directive of directives) {
    let kw = directive.trim().split(/\s+/g);
    let key = kw.shift();
    let values = res[key] || [];
    res[key] = values.concat(kw);
  }

  return res;
}

function patchCSP(csp) {
  let parsed_csp = parseCSP(csp);

  let stylesrc = parsed_csp['style-src'] || [];
  if (! stylesrc.includes("'unsafe-inline'") ) {
    let newstylesrc = ["'unsafe-inline'"];

    for (let src of stylesrc) {
      if (!src.startsWith("'nonce") && !src.startsWith('sha'))
        newstylesrc.push(src);
    }

    parsed_csp['style-src'] = newstylesrc;

    let new_csp = "";

    for (let kw in parsed_csp) {
      new_csp += kw + " " + parsed_csp[kw].join(" ") + "; ";
    }
    new_csp = new_csp.substring(0, new_csp.length-2);
    return new_csp;
  }
  return csp;
}
