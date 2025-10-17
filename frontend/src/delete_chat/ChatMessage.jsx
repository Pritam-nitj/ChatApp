import React from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/messages'; 

const ChatMessage = ({ message }) => {
    
    const handleDelete = async () => {
        if (!window.confirm("Delete this message for everyone?")) {
            return;
        }

        try {
            // Call the backend DELETE endpoint
            await axios.delete(`${API_URL}/${message._id}`);
            
            // The state will be updated via the socket event handled in useChatSocket.
        } catch (error) {
            console.error('Error deleting message:', error);
            alert("Failed to delete message.");
        }
    };

    const messageStyle = {
        padding: '10px',
        margin: '5px 0',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: message.isDeleted ? '#fef0f0' : '#e0f7fa',
        color: message.isDeleted ? '#888' : '#333',
        fontStyle: message.isDeleted ? 'italic' : 'normal',
    };

    return (
        <div style={messageStyle}>
            <div style={{ flexGrow: 1 }}>
                {/* Render the content, which will be the placeholder if deleted */}
                <strong>{message.senderId}:</strong> {message.content}
            </div>
            
            {/* Show Delete button only if the message is NOT deleted */}
            {!message.isDeleted && (
                <button 
                    onClick={handleDelete}
                    style={{ 
                        marginLeft: '10px', 
                        background: 'none', 
                        border: '1px solid red', 
                        color: 'red', 
                        cursor: 'pointer'
                    }}
                >
                    🗑️
                </button>
            )}
        </div>
    );
};

export default ChatMessage;