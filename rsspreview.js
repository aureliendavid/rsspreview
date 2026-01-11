(() => {
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

  // Detect system theme for the initial default
  const systemDarkDefault = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  // defaults
  var options = {
    doThumb: false,
    doMaxWidth: true,
    valMaxWidth: "900px",
    doDetect: true,
    preventPreview: false,
    fullPreview: false,
    doAuthor: false,
    darkTheme: systemDarkDefault, // DYNAMIC DEFAULT
    enableCss: false,
    bypassCSP: false,
    customCss: null,
    newTab: true,
  };

  const xml_parser = new XMLSerializer();
  const html_parser = new DOMParser();

  function xhrdoc(url, type, cb) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.responseType = "document";
    xhr.overrideMimeType(`text/${type}`);

    xhr.onload = () => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          const resp = type === "xml" ? xhr.responseXML : xhr.response;
          cb(resp);
        }
      }
    };

    xhr.send(null);
  }

  function applyxsl(xmlin, xsl, node, doc = document) {
    const xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    xsltProcessor.setParameter(null, "fullPreview", options.fullPreview);
    xsltProcessor.setParameter(null, "doAuthor", options.doAuthor);
    const fragment = xsltProcessor.transformToFragment(xmlin, doc);
    node.appendChild(fragment);
  }

  function getlang() {
    return browser.i18n.getUILanguage();
  }

  function formatsubtitle() {
    try {
      const feed_desc = document.getElementById("feedSubtitleRaw");

      const html_desc = html_parser.parseFromString(
        `<h2 id="feedSubtitleText">${feed_desc.innerText}</h2>`,
        "text/html",
      );
      const xml_desc = xml_parser.serializeToString(html_desc.body.firstChild);

      feed_desc.insertAdjacentHTML("afterend", xml_desc);

      feed_desc.parentNode.removeChild(feed_desc);
    } catch (e) {
      console.error(e);
    }
  }

  function formatdescriptions(el = document) {
    // unescapes descriptions to html then to xml
    const tohtml = el.getElementsByClassName("feedRawContent");

    for (let i = 0; i < tohtml.length; i++) {
      try {
        let html_txt = "";
        if (tohtml[i].getAttribute("desctype") === "text/plain") {
          html_txt =
            '<div class="feedEntryContent" style="white-space: pre-wrap;" >' +
            tohtml[i].innerHTML +
            "</div>";
        } else if (tohtml[i].getAttribute("desctype") === "xhtml") {
          html_txt = `<div class="feedEntryContent">${tohtml[i].innerHTML}</div>`;
        } else {
          html_txt = `<div class="feedEntryContent">${tohtml[i].textContent}</div>`;
        }

        const html_desc = html_parser.parseFromString(html_txt, "text/html");
        const xml_desc = xml_parser.serializeToString(
          html_desc.body.firstChild,
        );

        tohtml[i].insertAdjacentHTML("afterend", xml_desc);
        tohtml[i].setAttribute("todel", 1);
      } catch (e) {
        console.error(e);
        console.log(tohtml[i]);
      }
    }

    el.querySelectorAll(".feedRawContent").forEach((a) => {
      if (a.getAttribute("todel") === "1") {
        a.remove();
      }
    });
  }

  function removeemptyenclosures(el = document) {
    const encs = el.getElementsByClassName("enclosures");

    for (let i = 0; i < encs.length; i++)
      if (!encs[i].firstChild) encs[i].style.display = "none";
  }

  function formatfilenames(el = document) {
    const encfn = el.getElementsByClassName("enclosureFilename");

    for (let i = 0; i < encfn.length; i++) {
      const url = new URL(encfn[i].innerText);

      if (url) {
        const fn = url.pathname.split("/").pop();

        if (fn !== "") encfn[i].innerText = fn;
      }
    }
  }

  function formatfilesizes(el = document) {
    function humanfilesize(size) {
      let i = 0;

      if (size && size !== "" && size > 0)
        i = Math.floor(Math.log(size) / Math.log(1024));

      return (
        (size / 1024 ** i).toFixed(2) * 1 +
        " " +
        ["B", "kB", "MB", "GB", "TB"][i]
      );
    }

    const encsz = el.getElementsByClassName("enclosureSize");
    for (let i = 0; i < encsz.length; i++) {
      const hsize = humanfilesize(encsz[i].innerText);

      if (hsize) encsz[i].innerText = hsize;
    }
  }

  function formattitles(el = document) {
    const et = el.getElementsByClassName("entrytitle");

    for (let i = 0; i < et.length; i++) {
      //basically removes html content if there is some
      //only do it if there's a tag to avoid doing it when text titles cointain a '&'
      //(which can be caught but still displays an error in console, which is annoying)
      if (
        et[i].innerText.indexOf("<") >= 0 ||
        et[i].innerText.indexOf("&amp;")
      ) {
        const tmp = document.createElement("span");
        try {
          tmp.innerHTML = et[i].innerText;
          et[i].innerText = tmp.textContent;
        } catch (e) {
          // if not parsable, display as text
          console.error(e);
          console.log(et[i].innerText);
        }
      }
    }
  }

  function formatdates(el = document) {
    const lang = getlang();
    if (!lang) return;

    const opts = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const ed = el.getElementsByClassName("lastUpdated");
    for (let i = 0; i < ed.length; i++) {
      const d = new Date(ed[i].innerText);
      if (Number.isNaN(d)) continue;

      const dstr = `${d.toLocaleDateString(lang, opts)} ${d.toLocaleTimeString(lang)}`;

      ed[i].innerText = dstr;
    }

    const lu = el.getElementById("feedLastUpdate");
    if (lu && lu.innerText.trim() !== "") {
      lu.innerText = `Last updated: ${lu.innerText}`;
    }
  }

  function extensionimages(el = document) {
    const extimgs = el.getElementsByClassName("extImg");

    for (let i = 0; i < extimgs.length; i++)
      extimgs[i].src = chrome.runtime.getURL(
        extimgs[i].attributes["data-src"].nodeValue,
      );
  }

  function applysettings() {
    document.querySelectorAll(".mediaThumb").forEach((elem) => {
      elem.style.display = options.doThumb ? "block" : "none";
    });

    document.querySelectorAll("img").forEach((elem) => {
      if (options.doMaxWidth) elem.style["max-width"] = options.valMaxWidth;
    });
  }

  function makepreviewhtml() {
    const doc = document.implementation.createHTMLDocument("");
    doc.body.id = "rsspreviewBody";

    if (options.darkTheme) {
      doc.documentElement.classList.add("dark");
    }

    const feedBody = doc.createElement("div");
    feedBody.id = "feedBody";
    doc.body.appendChild(feedBody);

    const css = doc.createElement("link");
    css.setAttribute("rel", "stylesheet");
    css.setAttribute("href", chrome.runtime.getURL("preview.css"));
    doc.head.appendChild(css);

    if (options.enableCss && options.customCss) {
      const node = doc.createElement("style");
      node.innerHTML = options.customCss;
      doc.head.appendChild(node);
    }

    return doc;
  }

  function detect() {
    let rootNode = document.getRootNode();

    // for chrome
    const d = document.getElementById("webkit-xml-viewer-source-xml");
    if (d?.firstChild) rootNode = d.firstChild;

    const rootName = rootNode.documentElement.nodeName.toLowerCase();

    let isRSS1 = false;

    if (rootName === "rdf" || rootName === "rdf:rdf") {
      if (rootNode.documentElement.attributes.xmlns) {
        isRSS1 =
          rootNode.documentElement.attributes.xmlns.nodeValue.search("rss") > 0;
      }
    }

    if (
      rootName === "rss" ||
      rootName === "channel" || // rss2
      rootName === "feed" || // atom
      isRSS1
    )
      return rootNode;

    return null;
  }

  function main(feedNode) {
    const _feed_url = window.location.href;
    const preview = makepreviewhtml();

    xhrdoc(chrome.runtime.getURL("rss.xsl"), "xml", (xsl_xml) => {
      applyxsl(feedNode, xsl_xml, preview.getElementById("feedBody"), preview);

      // replace the content with the preview document
      document.replaceChild(
        document.importNode(preview.documentElement, true),
        document.documentElement,
      );

      const _t0 = performance.now();

      formatsubtitle();

      formatdescriptions();
      removeemptyenclosures();
      formatfilenames();
      formatfilesizes();
      formattitles();
      formatdates();
      extensionimages();
      applysettings();

      const _t1 = performance.now();
      //console.log("exec in: " + (t1 - t0) + "ms");

      document.title = document.getElementById("feedTitleText").innerText;
    });
  }

  function onOptions(opts) {
    options = opts;

    const feedRoot = detect();

    if (feedRoot && !options.preventPreview) {
      main(feedRoot);
    } else if (options.doDetect) {
      findFeeds();
    }
  }

  function onError(error) {
    console.log(`Error on get options: ${error}`);
  }

  const getting = browser.storage.sync.get(options);
  getting.then(onOptions, onError);

  function registerFeeds(feeds) {
    if (Object.keys(feeds).length > 0) {
      function handleResponse(_message) {}

      function handleError(_error) {
        //console.log(error);
      }

      browser.runtime.sendMessage(feeds).then(handleResponse, handleError);
    }
  }

  function findiTunesPodcastsFeeds() {
    var xhr;
    const match = document.URL.match(/id(\d+)/);
    if (match) {
      const feeds = {};
      const itunesid = match[1];

      xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `https://itunes.apple.com/lookup?id=${itunesid}&entity=podcast`,
      );

      xhr.onload = () => {
        if (xhr.readyState === xhr.DONE) {
          if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);

            if ("results" in res) {
              const pod = res.results[0];
              const title = pod.collectionName || document.title;
              const url = pod.feedUrl;
              if (url) {
                feeds[url] = title;
              }
            }
          }
        }

        registerFeeds(feeds);
      };
      xhr.send();
    }
  }

  function findYouTubeFeeds() {
    // YouTube's canonical channel URLs look like /channel/AlphaNumericID
    // It also supports named channels of the form /c/MyChannelName
    // and handle links of the form /@MyChannelHandle.
    // Match also on '%' to handle non-latin character codes
    // Match on both of these to autodetect channel feeds on either URL
    const idPattern = /channel\/([a-zA-Z0-9%_-]+)/;
    const namePattern = /(?:c|user)\/[a-zA-Z0-9%_-]+/;
    const handlePattern = /@[a-zA-Z0-9%_-]+/;
    const urlPattern = new RegExp(
      `${idPattern.source}|${namePattern.source}|${handlePattern.source}`,
    );
    if (document.URL.match(urlPattern)) {
      const feeds = {};
      const canonicalUrl = document.querySelector("link[rel='canonical']").href;
      const channelId = canonicalUrl.match(idPattern)[1];
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const title = document.title;
      feeds[url] = title;
      registerFeeds(feeds);
    }
  }

  // The default function used to find feeds if a domain-specific function doesn't exist.
  // Parse the document's HTML looking for link tags pointing to the feed URL.
  function defaultFindFeeds() {
    const feeds = {};
    document.querySelectorAll("link[rel='alternate']").forEach((elem) => {
      const type_attr = elem.getAttribute("type");
      if (!type_attr) {
        return;
      }

      const type = type_attr.toLowerCase();
      if (
        type.includes("rss") ||
        type.includes("atom") ||
        type.includes("feed")
      ) {
        const title = elem.getAttribute("title");
        const url = elem.href;

        if (url) {
          feeds[url] = title ? title : url;
        }
      }
    });
    registerFeeds(feeds);
  }

  const domainFeedFinders = new Map([
    ["itunes.apple.com", findiTunesPodcastsFeeds],
    ["podcasts.apple.com", findiTunesPodcastsFeeds],
    ["www.youtube.com", findYouTubeFeeds],
  ]);

  function findFeeds() {
    // Look up a feed detection function based on the domain.
    // If a domain-specific function doesn't exist, fall back to a default.
    const finder = domainFeedFinders.get(document.domain) || defaultFindFeeds;
    finder();
  }
})();
