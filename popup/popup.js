
var android = false;

browser.runtime.getPlatformInfo().then((info) => {
  android = info.os == "android"
});


document.addEventListener("DOMContentLoaded", function(event) {


  const feedList = document.getElementById('feedList');

  const url = new URL(location.href);
  // `+` converts the string to an number
  const tabId = +url.searchParams.get('tabId');
  const feeds = JSON.parse(url.searchParams.get('feeds'));

  browser.runtime.getPlatformInfo().then((info) => {
  android = info.os == "android";

  for (feed_url in feeds) {
    if (feeds.hasOwnProperty(feed_url)) {

      let li = document.createElement("div");
      li.classList.add("panel-list-item");
      li.setAttribute("data-href", feed_url);

      let a = document.createElement("div");
      a.classList.add("text");
      a.innerText = feeds[feed_url];

      li.appendChild(a);

      if (android)
        li.classList.add("android-feed-btn");

      feedList.appendChild(li);
    }
  }




  browser.storage.sync.get({newTab: !android}).then(function(options) {

  document.querySelectorAll(".panel-list-item").forEach( (elem) => {

    function onUpdated(tab) {
    }

    function onError(error) {
    }

    elem.addEventListener('click', (event) => {

      let url = elem.getAttribute("data-href");
      if (url) {
        if (options.newTab) {
          var params = { url: url } ;
          if (!android) {
            params.openerTabId = tabId ;
          }
          browser.tabs.create(params);
        }
        else
          browser.tabs.update({url: url}).then(onUpdated, onError);
      }
      if (android)
        window.close();

    });

  }); // end forall

  }); // end options

  }); // and getplatform

});
