(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
  	console.log("already run");
    return;
  }
  window.hasRun = true;


  var rootNode = document.getRootNode().documentElement;

  // for chrome
  var d = document.getElementById("webkit-xml-viewer-source-xml");
  if (d && d.firstChild)
    rootNode = d.firstChild;

  const rootName = rootNode.nodeName.toLowerCase();


  var isRSS1 = false;
  if (rootName == "rdf" || rootName == "rdf:rdf") {
    if (rootNode.attributes['xmlns']) {
      isRSS1 = (rootNode.attributes['xmlns'].nodeValue.search('rss') > 0)
    }
  }


  if ( rootName == "rss" || rootName == "channel"  // rss2
    || rootName == "feed"  // atom
    || isRSS1 ) {

    var feed_url = window.location.href;

    var url = "preview.html?" + encodeURIComponent(feed_url);
    url = chrome.extension.getURL(url);

    // redirect to preview page with feed url as query string
    window.location.replace(url);

  }

})();
