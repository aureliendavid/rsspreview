
function saveOptions(e) {
  e.preventDefault();

  browser.storage.sync.set({
    doThumb: document.querySelector("#doThumb").checked,
    doMaxWidth: document.querySelector("#doMaxWidth").checked,
    valMaxWidth: document.querySelector("#valMaxWidth").value
  });
}


function restoreOptions() {


  function onResult(result) {
    document.querySelector("#doThumb").checked = result.doThumb;
    document.querySelector("#doMaxWidth").checked = result.doMaxWidth;
    document.querySelector("#valMaxWidth").value = result.valMaxWidth;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.sync.get({
    doThumb: false,
    doMaxWidth: true,
    valMaxWidth: "900px"
  });
  getting.then(onResult, onError);

}



document.addEventListener("DOMContentLoaded", restoreOptions);

document.querySelectorAll('.validate').forEach((elem) => {
  elem.addEventListener('change', saveOptions);
});

