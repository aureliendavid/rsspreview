
function saveOptions(e) {
  e.preventDefault();

  browser.storage.sync.set({
    doThumb: document.querySelector("#doThumb").checked,
    doMaxWidth: document.querySelector("#doMaxWidth").checked,
    valMaxWidth: document.querySelector("#valMaxWidth").value,
    doDetect: document.querySelector("#doDetect").checked,
    preventPreview: document.querySelector("#preventPreview").checked,
    fullPreview: document.querySelector("#fullPreview").checked,
    enableCss: document.querySelector("#enableCss").checked,
    customCss: document.querySelector("#customCss").value
  });
}


function restoreOptions() {


  function onResult(result) {
    document.querySelector("#doThumb").checked = result.doThumb;
    document.querySelector("#doMaxWidth").checked = result.doMaxWidth;
    document.querySelector("#valMaxWidth").value = result.valMaxWidth;
    document.querySelector("#doDetect").checked = result.doDetect;
    document.querySelector("#preventPreview").checked = result.preventPreview;
    document.querySelector("#fullPreview").checked = result.fullPreview;
    document.querySelector("#enableCss").checked = result.enableCss;
    document.querySelector("#customCss").value = result.customCss;
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
    enableCss: false,
    customCss: null
  });
  getting.then(onResult, onError);

}



document.addEventListener("DOMContentLoaded", restoreOptions);

document.querySelectorAll('.validate').forEach((elem) => {
  elem.addEventListener('change', saveOptions);
});

