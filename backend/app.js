const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dgram = require('dgram');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const udpClient = dgram.createSocket('udp4');
const BLENDER_PORT = 5005;
const BLENDER_IP = '127.0.0.1';

io.on('connection', (socket) => {
  console.log('A device connected:', socket.id);

  // Handle device joining a specific room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Device ${socket.id} joined room ${roomId}`);
  });

  // Handle incoming Gyro data from the phone
  socket.on('gyro-data', (data) => {
    socket.volatile.to(data.roomId).emit('update-rotation', data);

    const payload = JSON.stringify(data);
    udpClient.send(payload, BLENDER_PORT, BLENDER_IP, (err) => {
      if (err) console.error('UDP Error:', err);
    });
  });

  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
