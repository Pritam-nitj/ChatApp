import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const username = 'Amit';
  const receiver = 'Rahul';

  useEffect(() => {
    fetch(`${API}/unread/${username}`)
      .then(res => res.json())
      .then(setMessages);
  }, []);

  const send = async () => {
    await fetch(`${API}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: username, receiver, content: text })
    });
    setText('');
  };

  const markRead = async () => {
    await fetch(`${API}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: username })
    });
    setMessages([]);
  };

  return (
    <div>
      <h2>Chat with {receiver}</h2>
      <div>
        {messages.map((m, i) => (
          <div key={i}><b>{m.sender}:</b> {m.content}</div>
        ))}
      </div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={send}>Send</button>
      <button onClick={markRead}>Mark All Read</button>
      <div>🔔 {messages.length} new message(s)</div>
    </div>
  );
}