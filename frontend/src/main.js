const sx_slider = document.getElementById("sensitivity-x-slider");
const sy_slider = document.getElementById("sensitivity-y-slider");
const sx_label = document.getElementById("sensitivity-x-val");
const sy_label = document.getElementById("sensitivity-y-val");

const invertX = document.getElementById("invertX");
const invertY = document.getElementById("invertY");

const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

let currentMode = 'viewport_touch'; 
let previousPage = "mainPage";
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

sx_label.innerText = sx_slider.value;
sy_label.innerText = sy_slider.value;
sx_slider.addEventListener("input", () => sx_label.innerText = sx_slider.value);
sy_slider.addEventListener("input", () => sy_label.innerText = sy_slider.value);

function showPage(pageID) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
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

function resizeCanvas() {
  if (!canvas || !canvas.parentElement) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

function drawUI(alpha = 0, beta = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#222';
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

document.querySelectorAll('.mode-item').forEach(item => {
  item.addEventListener('click', () => {
    const rawMode = item.getAttribute('data-mode');
    
    if (rawMode === 'settings') {
      previousPage = 'roomPage';
      showPage('settingPage');
      return;
    }

    document.querySelectorAll('.mode-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    if (rawMode === 'rotate') currentMode = 'viewport_touch';
    if (rawMode === 'zoom') currentMode = 'object_touch';
    if (rawMode === 'select') currentMode = 'gyro_control';
  });
});

let lastTouch = null;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    let dx = e.touches[1].clientX - e.touches[0].clientX;
    let dy = e.touches[1].clientY - e.touches[0].clientY;
    lastTouch = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      dist: Math.hypot(dx, dy),
      angle: Math.atan2(dy, dx)
    };
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!lastTouch) return;

  let payload = { roomId, mode: currentMode, touches: e.touches.length };

  if (e.touches.length === 1 && currentMode !== 'gyro_control') {
    payload.dx = e.touches[0].clientX - lastTouch.x;
    payload.dy = e.touches[0].clientY - lastTouch.y;
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    socket.emit('gyro-data', payload);
  } else if (e.touches.length === 2) {
    let dx = e.touches[1].clientX - e.touches[0].clientX;
    let dy = e.touches[1].clientY - e.touches[0].clientY;
    let cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    let cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    let dist = Math.hypot(dx, dy);
    let angle = Math.atan2(dy, dx);

    let twist = angle - lastTouch.angle;
    if (twist > Math.PI) twist -= 2 * Math.PI;
    if (twist < -Math.PI) twist += 2 * Math.PI;

    payload.dx = cx - lastTouch.x;
    payload.dy = cy - lastTouch.y;
    payload.zoomDelta = dist - lastTouch.dist;
    payload.twistDelta = twist;

    lastTouch = { x: cx, y: cy, dist: dist, angle: angle };
    socket.emit('gyro-data', payload);
  }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (e.touches.length === 0) lastTouch = null;
  else if (e.touches.length === 1) {
    lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
});

if (roomId) {
  socket.emit('join-room', roomId);
  showPage('roomPage');
  document.getElementById("roomID").innerText = roomId;

  const startSensors = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response !== 'granted') return;
    }

    window.addEventListener('deviceorientation', (event) => {
      drawUI(event.alpha, event.beta);
      
      if (currentMode === 'gyro_control') {
        socket.emit('gyro-data', {
          roomId: roomId,
          mode: 'gyro_control',
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
          sensX: parseFloat(sx_slider.value),
          sensY: parseFloat(sy_slider.value)
        });
      }
    });
  };

  document.body.addEventListener('click', startSensors, { once: true });
}

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