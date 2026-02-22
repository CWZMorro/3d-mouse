// --- Elements & State ---
const sx_slider = document.getElementById("sensitivity-x-slider");
const sy_slider = document.getElementById("sensitivity-y-slider");
const sx_label = document.getElementById("sensitivity-x-val");
const sy_label = document.getElementById("sensitivity-y-val");

const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

const socket = io();
let currentMode = 'rotate'; 
let mouseIsDown = false;
let previousPage = "mainPage";

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

// --- Initialization ---
sx_label.innerText = sx_slider.value;
sy_label.innerText = sy_slider.value;

// --- Sliders ---
sx_slider.addEventListener("input", () => sx_label.innerText = sx_slider.value);
sy_slider.addEventListener("input", () => sy_label.innerText = sy_slider.value);

// --- Navigation ---
function showPage(pageID) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(pageID).classList.add('active');
  
  const setupContainer = document.getElementById('setupContainer');
  if (pageID === 'roomPage') {
    if (setupContainer) setupContainer.style.display = 'none';
    setTimeout(resizeCanvas, 50);
  } else {
    if (setupContainer) setupContainer.style.display = 'flex';
  }
}

document.getElementById("connectBtn").addEventListener("click", () => { previousPage = "mainPage"; showPage("connectPage"); });
document.getElementById("settingBtn").addEventListener("click", () => { previousPage = "mainPage"; showPage("settingPage"); });
document.getElementById("connectBackBtn").addEventListener("click", () => showPage("mainPage"));
document.getElementById("settingBackBtn").addEventListener("click", () => showPage(previousPage));

// --- Canvas Drawing ---
function resizeCanvas() {
  if (!canvas || !canvas.parentElement) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

function drawUI(alpha = 0, beta = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#222'; // Subtle grid color
  ctx.lineWidth = 1;

  const step = 45;
  const offX = (alpha * 2) % step;
  const offY = (beta * 2) % step;

  ctx.beginPath();
  for (let x = offX; x < canvas.width; x += step) {
    ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
  }
  for (let y = offY; y < canvas.height; y += step) {
    ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

// --- Interaction & Modes ---
document.querySelectorAll('.mode-item').forEach(item => {
  item.addEventListener('click', () => {
    const mode = item.getAttribute('data-mode');
    
    if (mode === 'settings') {
      previousPage = 'roomPage';
      showPage('settingPage');
      return;
    }

    document.querySelectorAll('.mode-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    currentMode = mode;

    // Trigger immediate "Next Object" action for Select mode
    if (currentMode === 'select') {
      socket.emit('gyro-data', { roomId, action: 'next_object' });
    }
  });
});

window.addEventListener('touchstart', () => mouseIsDown = true);
window.addEventListener('touchend', () => mouseIsDown = false);
window.addEventListener('mousedown', () => mouseIsDown = true);
window.addEventListener('mouseup', () => mouseIsDown = false);

// --- Sensor Connection ---
if (roomId) {
  socket.emit('join-room', roomId);
  showPage('roomPage');
  document.getElementById("roomID").innerText = roomId;

  const startSensors = async () => {
    // Permission request for iOS devices
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response !== 'granted') return;
    }

    window.addEventListener('deviceorientation', (event) => {
      // Screen press overrides current mode to 'zoom'
      const activeMode = mouseIsDown ? 'zoom' : currentMode;
      
      drawUI(event.alpha, event.beta);

      socket.emit('gyro-data', {
        roomId: roomId,
        mode: activeMode,
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        isPressed: mouseIsDown,
        sensX: parseFloat(sx_slider.value),
        sensY: parseFloat(sy_slider.value)
      });
    });
  };

  document.body.addEventListener('click', startSensors, { once: true });
}

// --- QR Setup (Laptop side) ---
let isConnected = false;
let qrcode = null;
const toggleConnectBtn = document.getElementById("toggleConnectBtn");

toggleConnectBtn.addEventListener("click", () => {
  isConnected = !isConnected;
  if (isConnected) {
    toggleConnectBtn.innerText = "Disconnect";
    toggleConnectBtn.classList.add("disconnect-btn");

    const rId = Math.random().toString(36).substring(2, 8);
    const phoneUrl = `${window.location.origin}?room=${rId}`;

    document.getElementById("qrcode-section").classList.remove("hidden");
    qrcode = new QRCode(document.getElementById("qrcode-container"), {
      text: phoneUrl, width: 200, height: 200, colorDark: "#000", colorLight: "#fff"
    });
    document.getElementById("qrcode-url").innerText = phoneUrl;
  } else {
    location.reload(); 
  }
});