// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatItem from './ChatItem';

// Base URL for the backend API
const API_URL = 'http://localhost:5000/api/chats'; 

function App() {
    const [chats, setChats] = useState([]);
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch all chats
    const fetchChats = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL);
            setChats(response.data);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to fetch chats.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch chats on initial load
    useEffect(() => {
        fetchChats();
    }, []);

    // Function to handle form submission (creating a new chat)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !message) {
            alert('Please enter both username and message.');
            return;
        }

        try {
            const newChat = { username, message };
            const response = await axios.post(API_URL, newChat);

            // Update state: Add the newly created chat to the top of the list
            setChats(prevChats => [response.data, ...prevChats]);
            
            // Clear the message input
            setMessage(''); 
        } catch (err) {
            console.error('Post error:', err);
            alert('Failed to send message.');
        }
    };

    // Function to handle chat deletion (The corrected action)
    const handleDelete = async (chatId) => {
        try {
            // ✅ CORRECT: Send the DELETE request with the chat ID in the URL
            await axios.delete(`${API_URL}/${chatId}`);

            // Update state: Filter out the deleted chat from the local list
            setChats(prevChats => prevChats.filter(chat => chat._id !== chatId));

        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete chat. Check server logs.');
        }
    };

    if (loading) return <div className="chat-container">Loading chats...</div>;
    if (error) return <div className="chat-container" style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="chat-container">
            <h1>MERN Chat App</h1>

            {/* Input Form */}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Your Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Your Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                />
                <button type="submit">Send Message</button>
            </form>

            <hr />

            {/* Chat List */}
            <h2>Messages ({chats.length})</h2>
            <div className="chat-list">
                {chats.length > 0 ? (
                    chats.map(chat => (
                        // Pass the handleDelete function down to the ChatItem
                        <ChatItem key={chat._id} chat={chat} onDelete={handleDelete} />
                    ))
                ) : (
                    <p>No messages yet. Send one!</p>
                )}
            </div>
        </div>
    );
}

export default App;