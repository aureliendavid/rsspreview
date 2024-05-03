
var options = {
    newTab: true,
};

var android = false;

browser.runtime.getPlatformInfo().then((info) => {
  android = info.os == "android"
});


function onOptions(opts) {
  options = opts;
}

function onError(error) {
  console.log(`Error on get options: ${error}`);
}

browser.storage.sync.get(options).then(onOptions, onError);

document.addEventListener("DOMContentLoaded", function(event) {


  const feedList = document.getElementById('feedList');

  const url = new URL(location.href);
  // `+` converts the string to an number
  const tabId = +url.searchParams.get('tabId');
  const feeds = JSON.parse(url.searchParams.get('feeds'));

  for (feed_url in feeds) {
    if (feeds.hasOwnProperty(feed_url)) {

      let li = document.createElement("div");
      li.classList.add("panel-list-item");
      li.setAttribute("data-href", feed_url);

      let a = document.createElement("div");
      a.classList.add("text");
      a.innerText = feeds[feed_url];

      li.appendChild(a);

      browser.runtime.getPlatformInfo().then((info) => {
        android = info.os == "android"

        if (android)
          li.classList.add("android-feed-btn");
      });


      feedList.appendChild(li);
    }
  }

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

  });

});
