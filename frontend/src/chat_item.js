// frontend/src/ChatItem.js
import React from 'react';

const ChatItem = ({ chat, onDelete }) => {
    // Format the date nicely
    const date = new Date(chat.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="chat-item">
            <div>
                <strong>{chat.username}</strong> ({date}): {chat.message}
            </div>
            <button className="delete-btn" onClick={() => onDelete(chat._id)}>
                Delete
            </button>
        </div>
    );
};

export default ChatItem;