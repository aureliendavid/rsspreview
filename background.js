
function detectFeed(event) {

	// force application/rss+xml to text/xml so the browser displays it instead of downloading

	for (var header of event.responseHeaders) {
	    if (header.name.toLowerCase() == "content-type") {
			header.value = header.value.replace(/application\/(rss|atom)\+xml/,'text/xml');
			break;
	    }
	}

    return {
        responseHeaders: event.responseHeaders
    };

}

browser.webRequest.onHeadersReceived.addListener(
    detectFeed,
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking", "responseHeaders"]
)
