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

    // Notify the new user if someone is already sharing screen
    if (screenSharerInRoom[roomId]) {
        console.log(`📺 Notifying ${socket.id} that ${screenSharerInRoom[roomId]} is sharing screen`);
        socket.emit("screen-share-started", { 
          sharerId: screenSharerInRoom[roomId],
          sharerUsername: socketMeta[screenSharerInRoom[roomId]]?.username 
        });
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

  // Enhanced screen sharing handlers
  socket.on('start-screen-share', () => {
    const meta = socketMeta[socket.id];
    if (!meta) {
      console.log(`❌ No metadata found for ${socket.id} when starting screen share`);
      return;
    }
    
    const { roomId, username } = meta;
    
    // Check if someone else is already sharing
    if (screenSharerInRoom[roomId] && screenSharerInRoom[roomId] !== socket.id) {
      console.log(`⚠️ ${socket.id} tried to share screen but ${screenSharerInRoom[roomId]} is already sharing`);
      socket.emit('screen-share-error', { 
        error: 'Another user is already sharing their screen' 
      });
      return;
    }
    
    screenSharerInRoom[roomId] = socket.id;
    console.log(`📺 ${username} (${socket.id}) started screen sharing in room ${roomId}`);
    
    // Notify all users in the room (including the sharer for confirmation)
    io.to(roomId).emit('screen-share-started', { 
      sharerId: socket.id,
      sharerUsername: username 
    });
    
    // Send confirmation to the sharer
    socket.emit('screen-share-started-confirm', { 
      success: true,
      sharerId: socket.id 
    });
  });

  socket.on('stop-screen-share', () => {
    const meta = socketMeta[socket.id];
    if (!meta) {
      console.log(`❌ No metadata found for ${socket.id} when stopping screen share`);
      return;
    }
    
    const { roomId, username } = meta;
    
    // Only allow the current sharer to stop
    if (screenSharerInRoom[roomId] !== socket.id) {
      console.log(`⚠️ ${socket.id} tried to stop screen share but they're not the current sharer`);
      return;
    }
    
    delete screenSharerInRoom[roomId];
    console.log(`📺 ${username} (${socket.id}) stopped screen sharing in room ${roomId}`);
    
    // Notify all users in the room
    io.to(roomId).emit('screen-share-stopped', { 
      stoppedBy: socket.id,
      stoppedByUsername: username 
    });
  });

  // Enhanced screen share signaling for WebRTC
  socket.on('screen-share-signal', ({ to, from, signal, type }) => {
    console.log(`📡 Screen share signal from ${from} to ${to}, type: ${type || 'unknown'}`);
    
    // Validate that the sender is actually sharing
    const fromMeta = socketMeta[from];
    if (!fromMeta || screenSharerInRoom[fromMeta.roomId] !== from) {
      console.log(`❌ Invalid screen share signal from ${from} - not the current sharer`);
      return;
    }
    
    // Validate that the receiver is in the same room
    const toMeta = socketMeta[to];
    if (!toMeta || toMeta.roomId !== fromMeta.roomId) {
      console.log(`❌ Invalid screen share signal - users not in same room`);
      return;
    }
    
    io.to(to).emit('screen-share-signal', { 
      from, 
      signal, 
      type: type || 'offer'
    });
  });

  // Handle screen share signal responses (answers, ice candidates)
  socket.on('screen-share-signal-response', ({ to, from, signal, type }) => {
    console.log(`📡 Screen share response from ${from} to ${to}, type: ${type || 'unknown'}`);
    
    // Basic validation
    const fromMeta = socketMeta[from];
    const toMeta = socketMeta[to];
    
    if (!fromMeta) {
      console.log(`❌ No metadata found for response sender ${from}`);
      return;
    }
    
    if (!toMeta) {
      console.log(`❌ No metadata found for response receiver ${to}`);
      return;
    }
    
    if (fromMeta.roomId !== toMeta.roomId) {
      console.log(`❌ Response users not in same room - From: ${fromMeta.roomId}, To: ${toMeta.roomId}`);
      return;
    }
    
    console.log(`✅ Forwarding screen share response from ${from} to ${to}`);
    io.to(to).emit('screen-share-signal-response', { 
      from, 
      signal, 
      type: type || 'answer'
    });
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

    const { roomId, username } = meta;
    
    // Handle screen sharing cleanup
    if (screenSharerInRoom[roomId] === socket.id) {
        delete screenSharerInRoom[roomId];
        console.log(`📺 ${username} (${socket.id}) disconnected while screen sharing`);
        socket.to(roomId).emit('screen-share-stopped', { 
          stoppedBy: socket.id,
          stoppedByUsername: username,
          reason: 'disconnect'
        });
    }

    // Clean up user from room
    usersInRoom[roomId] = usersInRoom[roomId]?.filter((id) => id !== socket.id) || [];
    delete socketMeta[socket.id];

    socket.to(roomId).emit("user-left", { userId: socket.id });
    console.log(`❌ ${username} (${socket.id}) disconnected from room ${roomId}`);
  });

  // Debug endpoint for troubleshooting
  socket.on('debug-room-state', (roomId) => {
    const roomUsers = usersInRoom[roomId] || [];
    const screenSharer = screenSharerInRoom[roomId];
    
    console.log(`🐛 Room ${roomId} state:`, {
      users: roomUsers.map(id => ({ id, meta: socketMeta[id] })),
      screenSharer: screenSharer ? { id: screenSharer, meta: socketMeta[screenSharer] } : null
    });
    
    socket.emit('debug-room-state', {
      roomId,
      users: roomUsers.map(id => ({ id, ...socketMeta[id] })),
      screenSharer: screenSharer ? { id: screenSharer, ...socketMeta[screenSharer] } : null
    });
  });
});

// --- CHANGE 2: Use Render's Port ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});