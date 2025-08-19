const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// --- CHANGE 1: Update CORS Origin ---
// You will replace this with your Vercel URL after you deploy the frontend.
const vercelFrontendUrl = "https://node-call-sigma.vercel.app"; 

const io = new Server(server, {
  cors: {
    origin: [ "http://localhost:5173", vercelFrontendUrl ], // Allow both local and deployed frontend
    methods: ["GET", "POST"],
  },
});

const usersInRoom = {};
const socketMeta = {};
const screenSharerInRoom = {}; 

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, username, avatar }) => {
    console.log(`👤 ${username} (${socket.id}) joined room ${roomId}`);
    socket.join(roomId);

    if (!usersInRoom[roomId]) {
      usersInRoom[roomId] = [];
    }
    
    const otherUsers = usersInRoom[roomId].map(id => ({...socketMeta[id], id}));
    socket.emit("all-users", otherUsers);
    
    usersInRoom[roomId].push(socket.id);
    socketMeta[socket.id] = { roomId, username, avatar };

    socket.to(roomId).emit("user-joined", {
        userId: socket.id,
        username,
        avatar,
    });

    if (screenSharerInRoom[roomId]) {
        socket.emit("screen-share-started", { sharerId: screenSharerInRoom[roomId] });
    }
  });

  socket.on("send-signal", ({ userToSignal, signal }) => {
    const { username, avatar } = socketMeta[socket.id];
    io.to(userToSignal).emit("receive-signal", {
      signal,
      callerId: socket.id,
      callerUsername: username,
      callerAvatar: avatar,
    });
  });

  socket.on("return-signal", ({ signal, callerId }) => {
    io.to(callerId).emit("returned-signal", {
      signal,
      id: socket.id,
    });
  });

  socket.on('start-screen-share', () => {
    const meta = socketMeta[socket.id];
    if (!meta) return;
    const { roomId } = meta;
    screenSharerInRoom[roomId] = socket.id;
    socket.to(roomId).emit('screen-share-started', { sharerId: socket.id });
  });

  socket.on('stop-screen-share', () => {
    const meta = socketMeta[socket.id];
    if (!meta) return;
    const { roomId } = meta;
    delete screenSharerInRoom[roomId];
    socket.to(roomId).emit('screen-share-stopped');
  });

  socket.on('screen-share-signal', ({ to, from, signal }) => {
    io.to(to).emit('screen-share-signal', { from, signal });
  });
  
  socket.on("send-message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive-message", {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("typing");
  });

  socket.on("stop-typing", (roomId) => {
    socket.to(roomId).emit("stop-typing");
  });

  socket.on("disconnect", () => {
    const meta = socketMeta[socket.id];
    if (!meta) return;

    const { roomId } = meta;
    
    if (screenSharerInRoom[roomId] === socket.id) {
        delete screenSharerInRoom[roomId];
        socket.to(roomId).emit('screen-share-stopped');
    }

    usersInRoom[roomId] = usersInRoom[roomId]?.filter((id) => id !== socket.id) || [];
    delete socketMeta[socket.id];

    socket.to(roomId).emit("user-left", { userId: socket.id });
    console.log(`❌ ${socket.id} disconnected from room ${roomId}`);
  });
});

// --- CHANGE 2: Use Render's Port ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
