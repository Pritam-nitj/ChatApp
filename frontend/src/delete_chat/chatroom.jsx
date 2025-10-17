import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useChatSocket from '../hooks/useChatSocket';
import ChatMessage from './ChatMessage';

const API_URL = 'http://localhost:5000/api/messages';
const CHAT_ROOM_ID = 'general_room'; 

const ChatRoom = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Connect the real-time handler (Step 2)
    useChatSocket(CHAT_ROOM_ID, setMessages);

    // Function to fetch initial messages
    const fetchMessages = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/${CHAT_ROOM_ID}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);
    
    if (loading) {
        return <div>Loading chat...</div>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '15px' }}>
            <h2>Chat Room: {CHAT_ROOM_ID}</h2>
            <p style={{ color: '#555' }}>*(Anyone can delete any message)*</p>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {messages.map((message) => (
                    <ChatMessage 
                        key={message._id} 
                        message={message}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatRoom;