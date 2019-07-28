(function() {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    console.log('already run');
    return;
  }

  window.hasRun = true;

  // defaults
  var options = {
    doThumb: false,
    doMaxWidth: true,
    valMaxWidth: "900px",
    doDetect: true,
    preventPreview: false,
    fullPreview: false,
    doAuthor: false,
    enableCss: false,
    customCss: null
  };

  let xml_parser = new XMLSerializer();
  let html_parser = new DOMParser();

  function xhrdoc(url, type, cb) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.responseType = 'document';
    xhr.overrideMimeType('text/' + type);

    xhr.onload = () => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          let resp = type == 'xml' ? xhr.responseXML : xhr.response;
          cb(resp);
        }
      }
    };

    xhr.send(null);
  }

  function applyxsl(xmlin, xsl, node, doc = document) {
    let xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    xsltProcessor.setParameter(null, 'fullPreview', options.fullPreview);
    xsltProcessor.setParameter(null, 'doAuthor', options.doAuthor);
    let fragment = xsltProcessor.transformToFragment(xmlin, doc);
    node.appendChild(fragment);
  }

  function getlang() {
    if (navigator.languages && navigator.languages[0])
      return navigator.languages[0];
    else if (navigator.language) return navigator.language;
    else return null;
  }

  function formatsubtitle() {
    try {
      let feed_desc = document.getElementById('feedSubtitleRaw');

      let html_desc = html_parser.parseFromString(
        '<h2 id="feedSubtitleText">' + feed_desc.innerText + '</h2>',
        'text/html'
      );
      let xml_desc = xml_parser.serializeToString(html_desc.body.firstChild);

      feed_desc.insertAdjacentHTML('afterend', xml_desc);

      feed_desc.parentNode.removeChild(feed_desc);
    } catch (e) {
      console.error(e);
      console.log(feed_desc.innerText);
    }
  }

  function formatdescriptions(el = document) {
    // unescapes descriptions to html then to xml
    let tohtml = el.getElementsByClassName('feedRawContent');

    for (let i = 0; i < tohtml.length; i++) {

      try {
        let html_txt = '';
        if (tohtml[i].getAttribute('desctype') == 'text/plain') {
          html_txt = '<div class="feedEntryContent" style="white-space: pre-wrap;" >' + tohtml[i].innerHTML + '</div>';
        }
        else if (tohtml[i].getAttribute('desctype') == 'xhtml') {
          html_txt = '<div class="feedEntryContent">' + tohtml[i].innerHTML + '</div>';
        }
        else {
          html_txt = '<div class="feedEntryContent">' + tohtml[i].textContent + '</div>';
        }

        let html_desc = html_parser.parseFromString(html_txt, 'text/html');
        let xml_desc = xml_parser.serializeToString(
          html_desc.body.firstChild
        );

        tohtml[i].insertAdjacentHTML('afterend', xml_desc);
        tohtml[i].setAttribute('todel', 1);
      } catch (e) {
        console.error(e);
        console.log(tohtml[i]);
      }

    }

    el.querySelectorAll('.feedRawContent').forEach(a => {
      if (a.getAttribute('todel') == '1') {
        a.remove();
      }
    });
  }

  function removeemptyenclosures(el = document) {
    let encs = el.getElementsByClassName('enclosures');

    for (let i = 0; i < encs.length; i++)
      if (!encs[i].firstChild) encs[i].style.display = 'none';
  }

  function formatfilenames(el = document) {
    let encfn = el.getElementsByClassName('enclosureFilename');

    for (let i = 0; i < encfn.length; i++) {
      let url = new URL(encfn[i].innerText);

      if (url) {
        let fn = url.pathname.split('/').pop();

        if (fn != '') encfn[i].innerText = fn;
      }
    }
  }

  function formatfilesizes(el = document) {
    function humanfilesize(size) {
      let i = 0;

      if (size && size != '' && size > 0)
        i = Math.floor(Math.log(size) / Math.log(1024));

      return (
        (size / Math.pow(1024, i)).toFixed(2) * 1 +
        ' ' +
        ['B', 'kB', 'MB', 'GB', 'TB'][i]
      );
    }

    let encsz = el.getElementsByClassName('enclosureSize');
    for (let i = 0; i < encsz.length; i++) {
      let hsize = humanfilesize(encsz[i].innerText);

      if (hsize) encsz[i].innerText = hsize;
    }
  }

  function formattitles(el = document) {
    let et = el.getElementsByClassName('entrytitle');

    for (let i = 0; i < et.length; i++) {
      //basically removes html content if there is some
      //only do it if there's a tag to avoid doing it when text titles cointain a '&'
      //(which can be caught but still displays an error in console, which is annoying)
      if (et[i].innerText.indexOf('<') >= 0) {
        let tmp = document.createElement('span');
        try {
          tmp.innerHTML = et[i].innerText;
          et[i].innerText = tmp.textContent;
        } catch (e) {
          console.error(e);
          console.log(et[i].innerText);
        }
      }
    }
  }

  function formatdates(el = document) {
    let lang = getlang();
    if (!lang) return;

    let opts = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    let ed = el.getElementsByClassName('lastUpdated');
    for (let i = 0; i < ed.length; i++) {
      let d = new Date(ed[i].innerText);
      if (isNaN(d)) continue;

      let dstr =
        d.toLocaleDateString(lang, opts) + ' ' + d.toLocaleTimeString(lang);

      ed[i].innerText = dstr;
    }
  }

  function extensionimages(el = document) {
    let extimgs = el.getElementsByClassName('extImg');

    for (let i = 0; i < extimgs.length; i++)
      extimgs[i].src = chrome.extension.getURL(
        extimgs[i].attributes['data-src'].nodeValue
      );
  }

  function applysettings() {

    document.querySelectorAll('.mediaThumb').forEach((elem) => {
      elem.style.display = options.doThumb ? "block" : "none";
    });


    document.querySelectorAll('img').forEach((elem) => {
      if (options.doMaxWidth)
        elem.style["max-width"] = options.valMaxWidth;
    });

  }

  function makepreviewhtml() {
    let doc = document.implementation.createHTMLDocument('');
    doc.body.id = "rsspreviewBody";

    let feedBody = doc.createElement('div');
    feedBody.id = 'feedBody';
    doc.body.appendChild(feedBody);

    let css = doc.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('href', chrome.extension.getURL('preview.css'));
    doc.head.appendChild(css);

    if (options.enableCss && options.customCss) {
      let node = doc.createElement('style');
      node.innerHTML = options.customCss;
      doc.head.appendChild(node);
    }

    return doc;
  }

  function detect() {
    let rootNode = document.getRootNode().documentElement;

    // for chrome
    let d = document.getElementById('webkit-xml-viewer-source-xml');
    if (d && d.firstChild) rootNode = d.firstChild;

    const rootName = rootNode.nodeName.toLowerCase();

    let isRSS1 = false;

    if (rootName == 'rdf' || rootName == 'rdf:rdf')
      if (rootNode.attributes['xmlns'])
        isRSS1 = rootNode.attributes['xmlns'].nodeValue.search('rss') > 0;

    if (
      rootName == 'rss' ||
      rootName == 'channel' || // rss2
      rootName == 'feed' || // atom
      isRSS1
    )
      return rootNode;

    return null;
  }

  function main(feedNode) {
    let feed_url = window.location.href;
    let preview = makepreviewhtml();

    xhrdoc(chrome.extension.getURL('rss.xsl'), 'xml', xsl_xml => {
      applyxsl(feedNode, xsl_xml, preview.getElementById('feedBody'), preview);

      // replace the content with the preview document
      document.replaceChild(
        document.importNode(preview.documentElement, true),
        document.documentElement
      );

      let t0 = performance.now();

      formatsubtitle();

      formatdescriptions();
      removeemptyenclosures();
      formatfilenames();
      formatfilesizes();
      formattitles();
      formatdates();
      extensionimages();
      applysettings();

      let t1 = performance.now();
      //console.log("exec in: " + (t1 - t0) + "ms");

      document.title = document.getElementById('feedTitleText').innerText;
    });
  }


  function onOptions(opts) {
    options = opts;

    let feedRoot = detect();

    if (feedRoot && !options.preventPreview) {

      main(feedRoot);
    }

    else if (options.doDetect) {

      findFeeds();
    }

  }

  function onError(error) {
    console.log(`Error on get options: ${error}`);
  }

  let getting = browser.storage.sync.get(options);
  getting.then(onOptions, onError);


  function findFeeds() {

    let feeds = {};

    function registerFeeds(feeds) {

      if (Object.keys(feeds).length > 0) {

        function handleResponse(message) {
        }

        function handleError(error) {
          //console.log(error);
        }

        browser.runtime.sendMessage(feeds).then(handleResponse, handleError);
      }
    }

    var async_send = false;

    document.querySelectorAll("link[rel='alternate']").forEach( (elem) => {

      let type_attr = elem.getAttribute('type');
      if (!type_attr) {
        return;
      }

      let type = type_attr.toLowerCase();
      if (type.includes('rss') || type.includes('atom') || type.includes('feed')) {

        let title = elem.getAttribute('title');
        let url = elem.href;

        if (url) {

          feeds[url] = (title ? title : url);

        }
      }
    });

    if (document.domain == "itunes.apple.com" || document.domain == "podcasts.apple.com") {

      let match = document.URL.match(/id(\d+)/)
      if (match) {
        let itunesid = match[1];

        var xhr = new XMLHttpRequest();
        xhr.open('GET', "https://itunes.apple.com/lookup?id="+itunesid+"&entity=podcast");

        xhr.onload = function () {
          if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
              let res = JSON.parse(xhr.responseText);

              if ("results" in res) {

                let pod = res["results"][0];
                let title =  pod["collectionName"] || document.title;
                let url = pod["feedUrl"];
                if (url) {
                  feeds[url] = title;
                }
              }
            }
          }

          registerFeeds(feeds);
        };
        async_send = true;
        xhr.send();
      }
    }

    if (!async_send)
      registerFeeds(feeds);

  }


})();
