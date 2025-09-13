# Node-Call Backend: Project Workflow & Logic

This document provides a comprehensive overview of the Node-Call backend server, detailing the complete project workflow from the user's perspective and explaining the core logic for real-time communication.

---

## 1. Project Overview

Node-Call is a full-stack video communication application that enables users to connect for peer-to-peer video calls, screen sharing, and live chat. The backend is a lightweight but powerful **signaling server** built with Node.js, Express, and Socket.IO. Its primary responsibility is to manage user connections within private rooms and facilitate the initial WebRTC handshake that allows clients to establish a direct connection.

---

## 2. Live Backend & Screenshots

### Live Hosted Backend

The backend for this project is deployed on Render and is available at the following URL:

**[Backend Deployed here](https://node-call-v-1-2.onrender.com)**

### Screenshots

**Joining a Room:** 

<img width="1920" height="1466" alt="Landing_Page" src="https://github.com/user-attachments/assets/050c52ff-c408-4aa7-afdc-13de3139b1de" />

**In a Call:** 

<img width="1904" height="980" alt="Room" src="https://github.com/user-attachments/assets/7ff57533-b746-456b-b80a-71b763f497bb" />

---

## 3. The Complete User Workflow

The entire application flow is designed to be simple for the user but relies on a precise sequence of events between the frontend and backend.

### Step 1: User A Creates a Private Room

1.  **Frontend Action**: User A opens the application, enters their name (e.g., "Alice"), and clicks the "Create New Room" button.
2.  **Room ID Generation**: The React frontend generates a unique Room ID (e.g., `a1b2c3d4`) using the `uuid` library.
3.  **Navigation**: The frontend navigates Alice to the room page URL, for example, `/room/a1b2c3d4`, passing her username and avatar in the route's state.

### Step 2: User A Joins the Room on the Backend

1.  **Frontend Action**: Alice's browser loads the `Room.jsx` component. It requests access to her camera and microphone.
2.  **Backend Connection**: Once media is acquired, the frontend emits a `join-room` event to the backend server via Socket.IO.
    -   **Payload**: `{ roomId: "a1b2c3d4", username: "Alice", avatar: "👩" }`
3.  **Backend Logic**:
    -   The server receives the `join-room` event.
    -   It subscribes Alice's socket to a channel named after the `roomId` (`a1b2c3d4`).
    -   It stores Alice's metadata (username, avatar, roomId) in the `socketMeta` object and her socket ID in the `usersInRoom` object. At this point, she is the only one in the room.

### Step 3: User B Joins the Same Room

1.  **Frontend Action**: Alice shares the room URL with User B ("Bob"). Bob opens the link, enters his name, and is navigated to the same room page.
2.  **Backend Connection**: Bob's browser also loads the `Room.jsx` component, gets his media, and emits a `join-room` event.
    -   **Payload**: `{ roomId: "a1b2c3d4", username: "Bob", avatar: "👨" }`
3.  **Backend Logic**:
    -   The server receives Bob's `join-room` event.
    -   It sees that the room `a1b2c3d4` already has one user (Alice).
    -   The server emits an `all-users` event **only to Bob**, telling him that Alice is in the room.
    -   The server then adds Bob to the room and emits a `user-joined` event **to Alice**, telling her that Bob has arrived.

### Step 4: The WebRTC Handshake (Peer Connection)

This is the most critical part, where the backend acts as a matchmaker.

1.  **Frontend (Bob - Initiator)**: Upon receiving the `all-users` event, Bob's browser knows it needs to call Alice. It creates a WebRTC "offer" signal.
    -   It emits a `send-signal` event to the server, addressed to Alice.

2.  **Backend (Server)**: The server receives the `send-signal` event from Bob. It does not inspect the signal; it simply forwards it to Alice by emitting a `receive-signal` event.

3.  **Frontend (Alice - Receiver)**: Alice's browser receives the `receive-signal` event and Bob's offer. It creates a WebRTC "answer" signal.
    -   It emits a `return-signal` event to the server, addressed back to Bob.

4.  **Backend (Server)**: The server receives the `return-signal` from Alice and forwards it to Bob by emitting a `returned-signal` event.

5.  **Connection Established**: Bob receives Alice's answer. The handshake is complete! A direct, peer-to-peer WebRTC connection is established between their browsers for video and audio. The backend server is no longer involved in streaming the media.

### Step 5: Real-Time Chatting

The chat feature works in parallel and is much simpler.

1.  **Frontend Action**: Alice types a message and hits send.
2.  **Backend Connection**: The frontend emits a `send-message` event to the server.
    -   **Payload**: `{ roomId: "a1b2c3d4", username: "Alice", message: "Hello Bob!" }`
3.  **Backend Logic**: The server receives the message and broadcasts it to **everyone** in the room `a1b2c3d4` by emitting a `receive-message` event.
4.  **Frontend Action**: Bob's browser (and Alice's, so she sees her own message) receives the `receive-message` event and displays the new message in the chat box.

---

## 4. Setup and Installation

### Prerequisites

-   [Node.js](https://nodejs.org/) (v14 or later recommended)
-   [npm](https://www.npmjs.com/)

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <your-backend-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start 
    # Or use `npm run dev` if you have nodemon installed
    ```

The server will be running on `http://localhost:3000`. Ensure your frontend's `.env` file points to this address during local development.
