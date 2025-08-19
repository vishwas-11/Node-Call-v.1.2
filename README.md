# Node-Call

A real-time video calling and chat web application built using **Node.js**, **Express.js**, **Socket.io**, **WebRTC**, and **TailwindCSS**.

## Features

* Peer-to-peer video calling using **WebRTC**.
* Real-time chat functionality during video calls.
* Clean and responsive UI powered by **TailwindCSS**.
* Uses **Socket.io** for signaling and real-time messaging.
* Room-based call setup — share room ID to connect.

## Tech Stack

* **Node.js** – Server-side JavaScript runtime.
* **Express.js** – Lightweight web framework for Node.
* **Socket.io** – Enables real-time, bidirectional communication.
* **WebRTC** – Peer-to-peer video and audio communication.
* **TailwindCSS** – Utility-first CSS framework for fast UI development.

## 🚀 Live Demo

Check out the live version of the app here:  
👉 [https://node-call-69wl.onrender.com](https://node-call-69wl.onrender.com)

## Getting Started

### Prerequisites

* Node.js and npm installed on your machine.

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/node-call.git
   cd node-call
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the server:

   ```bash
   node server.js
   ```
4. Open in browser:

   ```
   http://localhost:3000
   ```
5. Share the room ID with another user to start a call.

## Folder Structure

```
node-call/
│── public/           # Static assets (HTML, CSS, client JS)
│── src/
│   ├── server.js     # Express and Socket.io server
│   ├── webrtc.js     # WebRTC signaling and logic
│── views/            # HTML templates (e.g., using EJS or plain HTML)
│── package.json      # Project metadata and dependencies
│── README.md         # Project documentation
```

## How It Works

* Users enter a room ID to join a video chat room.
* **Socket.io** handles room creation and signaling.
* **WebRTC** establishes direct peer-to-peer connections.
* Chat messages are exchanged through the same Socket.io connection.

## Screenshots

#### Chat from User 1
![chat_a](https://github.com/user-attachments/assets/c1f1e846-47c6-4a6f-b8c3-9286e6ea59a9)

#### Chat from User 2
![chat_b](https://github.com/user-attachments/assets/c0e5c1fe-1aab-45f9-8322-2d13e8850150)

#### Incoming Call
![incoming_call](https://github.com/user-attachments/assets/6cf98167-54ae-480a-af03-2decf17855a8)

#### Video calling feature from both remote and local window side
![video_calling ](https://github.com/user-attachments/assets/6d5263d3-3baf-4ee4-a162-e8dbdbbf0b65)


## Future Enhancements

* Add screen sharing functionality.
* Store chat history using a database.
* Add user authentication and profiles.
* Deploy on cloud platforms like Heroku or Vercel.

## Contributing

Feel free to fork this repo and submit a pull request. All contributions are appreciated!

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

* [WebRTC](https://webrtc.org/)
* [Socket.io](https://socket.io/)
* [TailwindCSS](https://tailwindcss.com/)

