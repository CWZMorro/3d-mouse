const sx_slider = document.getElementById("sensitivity-x-slider")
const sy_slider = document.getElementById("sensitivity-y-slider")

const sx_label = document.getElementById("sensitivity-x-val")
const sy_label = document.getElementById("sensitivity-y-val")

// initialize value
sx_label.innerText = sx_slider.value
sy_label.innerText = sy_slider.value

// change value as user changes input
sx_slider.addEventListener("input", function() {
  sx_label.innerText = sx_slider.value
});

sy_slider.addEventListener("input", function() {
  sy_label.innerText = sy_slider.value
});

// show the active page and hides the inactive page
function showPage(pageID) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));

  document.getElementById(pageID).classList.add('active');
}

document.getElementById("connectBtn").addEventListener(
  "click", () => showPage("connectPage")
);
document.getElementById("settingBtn").addEventListener(
  "click", () => showPage("settingPage")
);