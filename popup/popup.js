document.addEventListener("DOMContentLoaded", function(event) {


  const feedList = document.getElementById('feedList');

  const url = new URL(location.href);
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
      feedList.appendChild(li);
    }
  }

  document.querySelectorAll(".panel-list-item").forEach( (elem) => {

    elem.addEventListener('click', (event) => {

      let url = elem.getAttribute("data-href");
      if (url)
        browser.tabs.create({url: url});


    });

  });

});

