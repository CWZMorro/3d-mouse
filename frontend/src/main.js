const sx_slider = document.getElementById("sensitivity-x-slider");
const sy_slider = document.getElementById("sensitivity-y-slider");
const sx_label = document.getElementById("sensitivity-x-val");
const sy_label = document.getElementById("sensitivity-y-val");

// Initialize values
sx_label.innerText = sx_slider.value;
sy_label.innerText = sy_slider.value;

// Update values on input
sx_slider.addEventListener("input", function() {
  sx_label.innerText = sx_slider.value;
});

sy_slider.addEventListener("input", function() {
  sy_label.innerText = sy_slider.value;
});

// Toggle checkbox styling
document.querySelectorAll('.toggle-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    this.parentElement.classList.toggle('active', this.checked);
  });
});

// Page navigation
let previousPage = "mainPage";

function showPage(pageID) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(pageID).classList.add('active');
}

// Main Page Buttons
document.getElementById("connectBtn").addEventListener("click", () => {
  previousPage = "mainPage";
  showPage("connectPage");
});

document.getElementById("settingBtn").addEventListener("click", () => {
  previousPage = "mainPage";
  showPage("settingPage");
});

// Connect Page → Settings
document.getElementById("connectToSettingBtn").addEventListener("click", () => {
  previousPage = "connectPage";
  showPage("settingPage");
});

// Back Buttons
document.getElementById("connectBackBtn").addEventListener("click", () => {
  showPage("mainPage");
});

document.getElementById("settingBackBtn").addEventListener("click", () => {
  showPage(previousPage);
});

// Connect Toggle Functionality
let isConnected = false;
const toggleConnectBtn = document.getElementById("toggleConnectBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

toggleConnectBtn.addEventListener("click", () => {
  isConnected = !isConnected;
  if (isConnected) {
    toggleConnectBtn.innerText = "Disconnect";
    toggleConnectBtn.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    statusDot.classList.add("connected");
    statusText.innerText = "Connected";
  } else {
    toggleConnectBtn.innerText = "Connect Device";
    toggleConnectBtn.style.background = "";
    statusDot.classList.remove("connected");
    statusText.innerText = "Disconnected";
  }
});