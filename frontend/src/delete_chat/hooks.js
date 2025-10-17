import { useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

const useChatSocket = (chatRoomId, setMessages) => {
    
    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL); 
        socket.emit('joinRoom', chatRoomId);

        // --- Handle Real-time Deletion ---
        socket.on('messageDeleted', (data) => {
            if (data.chatRoomId === chatRoomId) {
                // Update the local state by mapping the messages
                setMessages(prevMessages => 
                    prevMessages.map(msg => {
                        if (msg._id === data.messageId) {
                            // Apply the soft delete changes
                            return { 
                                ...msg, 
                                isDeleted: true, 
                                content: "This message was deleted by a room member." 
                            };
                        }
                        return msg;
                    })
                );
            }
        });
        
        // Cleanup: disconnect socket when component unmounts
        return () => {
            socket.off('messageDeleted');
            socket.disconnect();
        };
    }, [chatRoomId, setMessages]);
};

export default useChatSocket;