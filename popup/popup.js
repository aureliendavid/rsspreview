document.addEventListener("DOMContentLoaded", function(event) {


  const feedList = document.getElementById('feedList');

  const url = new URL(location.href);
  const feeds = JSON.parse(url.searchParams.get('feeds'));

  for (feed_url in feeds) {
  	if (feeds.hasOwnProperty(feed_url)) {
  		let li = document.createElement("li");
  		let a = document.createElement("a");

  		a.href = feed_url;
  		a.target = "_blank";
  		a.innerText = feeds[feed_url];

  		li.appendChild(a);
  		feedList.appendChild(li);
  	}
  }

});

