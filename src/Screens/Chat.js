import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:6000"); // Socket server

export default function Chat({ username }) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState("");

  // On component mount
  useEffect(() => {
    socket.emit("userOnline", username);
    socket.emit("joinRoom", username);

    const fetchUsers = async () => {
      const res = await axios.get("https://my-react-social-app-backend.vercel.app/api/users");
      setUsers(res.data.filter(u => u.username !== username));
    };
    fetchUsers();

    socket.on("receiveMessage", (msg) => {
      if (msg.from === selectedUser || msg.to === selectedUser) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on("updateUsers", fetchUsers);

    return () => socket.disconnect();
  }, [selectedUser]);

  const selectUser = async (user) => {
    setSelectedUser(user.username);
    const res = await axios.get(`https://my-react-social-app-backend.vercel.app/api/messages/${username}/${user.username}`);
    setMessages(res.data);
  };

  const sendMessage = () => {
    if (!text || !selectedUser) return;
    const msg = { from: username, to: selectedUser, text };
    socket.emit("sendMessage", msg);
    setMessages(prev => [...prev, msg]);
    setText("");
  };

  return (
    <div style={{ display: "flex", gap: "50px" }}>
      <div>
        <h3>Users</h3>
        {users.map((user) => (
          <div key={user._id}>
            {user.username} - {user.online ? "Online" : "Offline"}
            <button onClick={() => selectUser(user)}>Chat</button>
          </div>
        ))}
      </div>

      {selectedUser && (
        <div>
          <h3>Chat with {selectedUser}</h3>
          <div style={{ border: "1px solid gray", height: "300px", overflowY: "scroll", padding: "5px" }}>
            {messages.map((m, i) => (
              <div key={i}><b>{m.from}:</b> {m.text}</div>
            ))}
          </div>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message..." />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}
