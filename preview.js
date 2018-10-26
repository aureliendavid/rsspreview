
document.addEventListener('DOMContentLoaded', function () {
	main();
});

function getxml(url) {

	var xhttp = new XMLHttpRequest();
	xhttp.open("GET", url, false);
	xhttp.send(null);
	return xhttp.responseXML;
}


function xhrxml(url, cb) {

	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);

	xhr.responseType = 'document';
	xhr.overrideMimeType('text/xml');

	xhr.onload = function () {
	  if (xhr.readyState === xhr.DONE) {
	    if (xhr.status === 200) {
	    	cb(xhr.responseXML);
	    }
	  }
	};

	xhr.send(null);

}

function applyxsl(xmlin, xsl, node) {

	var xsltProcessor = new XSLTProcessor();
	xsltProcessor.importStylesheet(xsl);

	var fragment = xsltProcessor.transformToFragment(xmlin, document);
	node.appendChild(fragment);

}

function formatdescriptions() {

	// unescapes descriptions to html

	var tohtml = document.getElementsByClassName("feedEntryContent");
	for (var i = 0; i<tohtml.length; i++) {
		tohtml[i].innerHTML = tohtml[i].innerText;
	}

	var feed_desc = document.getElementById("feedSubtitleText");
	feed_desc.innerHTML = feed_desc.innerText;

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


function addfeedurl(url) {

	var h1 = document.getElementById("feedTitleText");
	h1.innerHTML += ' :: <a href="'+url+'"><img src="icons/rss-32.png" class="headerIcon" />Feed URL</a>';
}

function main() {

	var query_string = location.search.substring(1).split("&");
	var feed_url = decodeURIComponent(query_string[0]);

	xhrxml(feed_url, function(feed_xml) {


		xhrxml(chrome.extension.getURL("rss.xsl"), function(xsl_xml) {

			applyxsl(feed_xml, xsl_xml, document.getElementById("feedBody"));

			removeemptyenclosures();
			formatdescriptions();
			formatfilenames();
			formatfilesizes();
			addfeedurl(feed_url);

			document.title = "RSSPreview: " + document.getElementById("feedTitleText").innerText;


		});

	});




}
