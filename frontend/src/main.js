// import { io } from "../node_modules/socket.io-client";

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
let qrcode = null;

const socket = io(`http://${window.location.hostname}:3000`);

const toggleConnectBtn = document.getElementById("toggleConnectBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const qrcodeSection = document.getElementById("qrcode-section");
const qrcodeContainer = document.getElementById("qrcode-container");
const qrcodeUrl = document.getElementById("qrcode-url");

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

// the link with roomID joins the room through the socket
if (roomId) {
  socket.emit('join-room', roomId);
  socket.on('update-rotation', (data) => {
    console.log("Received rotation: ", data);
  });
  showPage('roomPage');
  
  const roomID = document.getElementById("roomID");
  roomID.innerHTML = `The current room ID is ${roomId}`;
}

toggleConnectBtn.addEventListener("click", () => {
  isConnected = !isConnected;

  if (isConnected) {
    toggleConnectBtn.innerText = "Disconnect";
    toggleConnectBtn.classList.add("diconnect-btn");
    
    statusDot.classList.add("connected");
    statusText.innerText = "Connected";
    
    const roomId = Math.random().toString(36).substring(2,8);
    const phoneUrl = `${window.location.origin}?room=${roomId}`;

    qrcodeSection.classList.remove("hidden");
    qrcode = new QRCode(qrcodeContainer, {
      text: phoneUrl,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    qrcodeUrl.innerText = phoneUrl;

  } else {
    toggleConnectBtn.innerText = "Connect Device";
    toggleConnectBtn.classList.remove("disconnect-btn");
    statusDot.classList.remove("connected");
    statusText.innerText = "Disconnected";
    clearQRCode();
  }
});

function clearQRCode() {
  if (qrcode) {
    qrcode.clear();
    qrcode = null;
  }
  qrcodeContainer.innerHTML = "";
  qrcodeUrl.innerText = "";
  qrcodeSection.classList.add("hidden");
}

