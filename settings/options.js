
function saveOptions(e) {
  e.preventDefault();

  let options = {
    doThumb: document.querySelector("#doThumb").checked,
    doMaxWidth: document.querySelector("#doMaxWidth").checked,
    valMaxWidth: document.querySelector("#valMaxWidth").value,
    doDetect: document.querySelector("#doDetect").checked,
    preventPreview: document.querySelector("#preventPreview").checked,
    fullPreview: document.querySelector("#fullPreview").checked,
    doAuthor: document.querySelector("#doAuthor").checked,
    orangeIcon: document.querySelector("#orangeIcon").checked,
    enableCss: document.querySelector("#enableCss").checked,
    bypassCSP: document.querySelector("#bypassCSP").checked,
    customCss: document.querySelector("#customCss").value,
    newTab: document.querySelector("#newTab").checked
  };

  browser.storage.sync.set(options);
  localStorage.setItem('options', JSON.stringify(options));

}


function restoreOptions() {

  function onResult(result) {
    document.querySelector("#doThumb").checked = result.doThumb;
    document.querySelector("#doMaxWidth").checked = result.doMaxWidth;
    document.querySelector("#valMaxWidth").value = result.valMaxWidth;
    document.querySelector("#doDetect").checked = result.doDetect;
    document.querySelector("#preventPreview").checked = result.preventPreview;
    document.querySelector("#fullPreview").checked = result.fullPreview;
    document.querySelector("#doAuthor").checked = result.doAuthor;
    document.querySelector("#orangeIcon").checked = result.orangeIcon;
    document.querySelector("#enableCss").checked = result.enableCss;
    document.querySelector("#bypassCSP").checked = result.bypassCSP;
    document.querySelector("#customCss").value = result.customCss;
    document.querySelector("#newTab").checked = result.newTab;

    localStorage.setItem('options', JSON.stringify(result));
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.sync.get({
    doThumb: false,
    doMaxWidth: true,
    valMaxWidth: "900px",
    doDetect: true,
    preventPreview: false,
    fullPreview: false,
    doAuthor: false,
    orangeIcon: false,
    enableCss: false,
    bypassCSP: false,
    customCss: null,
    newTab: true
  });
  getting.then(onResult, onError);

}



document.addEventListener("DOMContentLoaded", restoreOptions);

document.querySelectorAll('.validate').forEach((elem) => {
  elem.addEventListener('change', saveOptions);
});
