var android = false;

browser.runtime.getPlatformInfo().then((info) => {
  android = info.os === "android";
});

document.addEventListener("DOMContentLoaded", (_event) => {
  const feedList = document.getElementById("feedList");

  const url = new URL(location.href);
  // `+` converts the string to an number
  const tabId = +url.searchParams.get("tabId");
  const feeds = JSON.parse(url.searchParams.get("feeds"));

  browser.runtime.getPlatformInfo().then((info) => {
    android = info.os === "android";

    for (feed_url in feeds) {
      if (Object.hasOwn(feeds, feed_url)) {
        const li = document.createElement("div");
        li.classList.add("panel-list-item");
        li.setAttribute("data-href", feed_url);

        const a = document.createElement("div");
        a.classList.add("text");
        a.innerText = feeds[feed_url];

        li.appendChild(a);

        if (android) li.classList.add("android-feed-btn");

        feedList.appendChild(li);
      }
    }

    browser.storage.sync.get({ newTab: !android }).then((options) => {
      document.querySelectorAll(".panel-list-item").forEach((elem) => {
        function onUpdated(_tab) {}

        function onError(_error) {}

        elem.addEventListener("click", (_event) => {
          const url = elem.getAttribute("data-href");
          const params = { url: url };
          if (url) {
            if (options.newTab) {
              if (!android) {
                params.openerTabId = tabId;
              }
              browser.tabs.create(params);
            } else browser.tabs.update({ url: url }).then(onUpdated, onError);
          }
          if (android) window.close();
        });
      }); // end forall
    }); // end options
  }); // and getplatform
});
