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



  function xhrdoc(url, type, cb) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.responseType = 'document';
    xhr.overrideMimeType('text/' + type);

    xhr.onload = function () {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          var resp = (type=="xml") ? xhr.responseXML : xhr.response;
          cb(resp);
        }
      }
    };

    xhr.send(null);

  }



  function applyxsl(xmlin, xsl, node, doc=document) {

    var xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);

    var fragment = xsltProcessor.transformToFragment(xmlin, doc);
    node.appendChild(fragment);

  }

  function formatdescriptions() {

    // unescapes descriptions to html then to xml

    var xml_parser = new XMLSerializer();
    var html_parser = new DOMParser();

    var tohtml = document.getElementsByClassName("feedRawContent");
    for (var i = 0; i<tohtml.length; i++) {

      try {

        var html_desc = html_parser.parseFromString('<div class="feedEntryContent">'+tohtml[i].innerText+'</div>', "text/html");
        var xml_desc = xml_parser.serializeToString(html_desc.body.firstChild);

        tohtml[i].insertAdjacentHTML('afterend', xml_desc);
        tohtml[i].setAttribute("todel", 1);

      }
      catch (e) {
        console.error(e);
        console.log(tohtml[i].innerHTML);
      }

    }

    document.querySelectorAll('.feedRawContent').forEach(function(a){
      if (a.getAttribute("todel") == "1") {
        a.remove();
      }
    })


    try {
      var feed_desc = document.getElementById("feedSubtitleRaw");

      var html_desc = html_parser.parseFromString('<h2 id="feedSubtitleText">'+feed_desc.innerText+'</h2>', "text/html");
      var xml_desc = xml_parser.serializeToString(html_desc.body.firstChild);

      feed_desc.insertAdjacentHTML('afterend', xml_desc);

      feed_desc.parentNode.removeChild(feed_desc);
    }
    catch (e) {
      console.error(e);
      console.log(feed_desc.innerText);
    }


  }


  function removeemptyenclosures() {

    var encs = document.getElementsByClassName("enclosures");
    for (var i = 0; i<encs.length; i++) {

      if (!encs[i].firstChild)
        encs[i].style.display = "none";

    }

  }

  function formatfilenames() {

    var encfn = document.getElementsByClassName("enclosureFilename");
    for (var i = 0; i<encfn.length; i++) {
      var url = new URL(encfn[i].innerText);
      if (url) {
        var fn = url.pathname.split("/").pop();
        if (fn != "") {
          encfn[i].innerText = fn;
        }
      }

    }

  }


  function formatfilesizes() {

    function humanfilesize(size) {
      var i = 0;
      if (size && size != "" && size > 0)
        i = Math.floor( Math.log(size) / Math.log(1024) );
        return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    };

    var encsz = document.getElementsByClassName("enclosureSize");
    for (var i = 0; i<encsz.length; i++) {
      var hsize = humanfilesize(encsz[i].innerText);
      if (hsize) {
        encsz[i].innerText = hsize;
      }

    }
  }


  function formattitles() {

    var et = document.getElementsByClassName("entrytitle");
    for (var i = 0; i<et.length; i++) {

      //basically removes html content if there is some
      //only do it if there's a tag to avoid doing it when text titles cointain a '&'
      //(which can be caught but still displays an error in console, which is annoying)

      if (et[i].innerText.indexOf('<') >= 0) {

        var tmp = document.createElement("span");
        try {
          tmp.innerHTML = et[i].innerText;
          et[i].innerText = tmp.textContent;
        }
        catch (e) {
          console.error(e);
          console.log(et[i].innerText);
        }

      }

    }

  }


  function getlang() {
    if (navigator.languages && navigator.languages[0])
      return navigator.languages[0];
    else if (navigator.language)
      return navigator.language;
    else
      return null;
  }

  function formatdates() {

    var lang = getlang();
    if (!lang)
      return;

    var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    var ed = document.getElementsByClassName("lastUpdated");
    for (var i = 0; i<ed.length; i++) {

      var d = new Date(ed[i].innerText);
      if (isNaN(d))
        continue;

      var dstr = d.toLocaleDateString(lang, opts) + ' ' + d.toLocaleTimeString(lang);
      ed[i].innerText = dstr;

    }

  }


  function addfeedurl(url) {

    var h1 = document.getElementById("feedTitleText");
    h1.innerHTML += ' :: <a href="'+url+'"><img src="'+chrome.extension.getURL("icons/rss-32.png")+'" class="headerIcon" />Feed URL</a>';
  }


  function extensionimages() {

    var extimgs = document.getElementsByClassName("extImg");
    for (var i = 0; i<extimgs.length; i++) {
      extimgs[i].src = chrome.extension.getURL(extimgs[i].attributes['data-src'].nodeValue);
    }

  }

  function makepreviewhtml() {

    var doc = document.implementation.createHTMLDocument("");

    var feedBody = doc.createElement("div");
    feedBody.id = "feedBody";
    doc.body.appendChild(feedBody);

    var css = doc.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('href', chrome.extension.getURL("preview.css"));
    doc.head.appendChild(css);

    return doc;


  }


  function detect() {

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


      return rootNode;

    }

    return null;

  }


  function main(feedNode) {

      var feed_url = window.location.href;

      var preview = makepreviewhtml();

      xhrdoc(chrome.extension.getURL("rss.xsl"), "xml", function(xsl_xml) {

        applyxsl(feedNode, xsl_xml, preview.getElementById("feedBody"), preview);

        // replace the content with the preview document
        document.replaceChild(document.importNode(preview.documentElement, true), document.documentElement);

        removeemptyenclosures();
        formatdescriptions();
        formatfilenames();
        formatfilesizes();
        formattitles();
        formatdates();
        extensionimages();

        document.title = /*"RSSPreview: " + */document.getElementById("feedTitleText").innerText;

        //addfeedurl(feed_url);


      });



  }

  var feedRoot = detect();

  if (feedRoot)
    main(feedRoot);

})();
