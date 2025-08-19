const express = require("express");
const router = express.Router();

// If you're using React for frontend routing, you likely don't need these at all.
// Keep them only if you serve some EJS templates (like a fallback route).

router.get("/", (req, res) => {
  res.send("Server is running");
});

// 🔴 Comment out or remove this route to stop server-side ID generation
// router.get("/create-room", (req, res) => {
//   const roomId = uuidv4();
//   res.redirect(`/room/${roomId}`);
// });

router.get("/room/:roomId", (req, res) => {
  res.send(`Room ID: ${req.params.roomId}`);
});

module.exports = router;
