const express = require("express");
const router = express.Router();


router.get("/", (req, res) => {
  res.send("Server is running");
});

router.get("/room/:roomId", (req, res) => {
  res.send(`Room ID: ${req.params.roomId}`);
});

module.exports = router;
