import { create } from 'zustand';
import toast from '../lib/toast';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from './useAuthStore';
import { useEncryptionStore } from './useEncryptionStore';

const getErrorMessage = (error, fallback = 'An error occurred') => {
  if (!error) return fallback;
  if (error.response && error.response.data) {
    return (
      error.response.data.message ||
      error.response.data.error ||
      JSON.stringify(error.response.data) ||
      fallback
    );
  }
  if (error.message) return error.message;
  return String(error);
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  groupMessages: [],
  addGroup: '',
  pinnedChats: [],
  archivedChats: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  userLastSeen: {},
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  isGroupCreating: false,

  getUsers: async (q) => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/messages/users', {
        params: q ? { q } : undefined,
      });
      const users = res.data;
      const lastSeenUpdates = {};
      users.forEach((user) => {
        if (user.lastSeen) {
          lastSeenUpdates[user._id] = user.lastSeen;
        }
      });
      set({
        users,
        userLastSeen: { ...get().userLastSeen, ...lastSeenUpdates },
      });
      await get().getPinnedChats();
      await get().getArchivedChats();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch users'));
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getArchivedChats: async () => {
    try {
      const res = await axiosInstance.get('/messages/archived/chats');
      const archivedIds = res.data.map((chat) => (chat._id ? chat._id : chat));
      set({ archivedChats: archivedIds });
    } catch (error) {
      console.error('Failed to fetch archived chats:', error);
    }
  },

  getPinnedChats: async () => {
    try {
      const res = await axiosInstance.get('/messages/pinned/chats');
      set({ pinnedChats: res.data });
    } catch (error) {
      console.error('Error getting pinned chats:', error);
    }
  },

  pinChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/pin/${userId}`);
      const { pinnedChats } = get();
      const userToPin = get().users.find((user) => user._id === userId);
      if (userToPin && !pinnedChats.find((chat) => chat._id === userId)) {
        set({ pinnedChats: [...pinnedChats, userToPin] });
      }
      toast.success('Chat pinned successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to pin chat');
    }
  },

  archiveChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/archive/${userId}`);
      const { archivedChats } = get();
      set({ archivedChats: [...archivedChats, userId] });
      toast.success('Chat archived successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to archive chat');
    }
  },

  unpinChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/unpin/${userId}`);
      const { pinnedChats } = get();
      set({ pinnedChats: pinnedChats.filter((chat) => chat._id !== userId) });
      toast.success('Chat unpinned successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unpin chat');
    }
  },

  unarchiveChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/unarchive/${userId}`);
      const { archivedChats } = get();
      set({ archivedChats: archivedChats.filter((id) => id !== userId) });
      toast.success('Chat unarchived successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unarchive chat');
    }
  },

  isChatPinned: (userId) => {
    const { pinnedChats } = get();
    return pinnedChats.some((chat) => chat._id === userId);
  },

  isChatArchived: (userId) => {
    const { archivedChats } = get();
    return archivedChats.includes(userId);
  },

  // UPDATED: Get messages with proper E2EE handling
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const messages = res.data;
      const encStore = useEncryptionStore.getState();
      const currentUser = useAuthStore.getState().authUser;

      const hasPrivateKey = encStore.myPrivateKey !== null;
      
      if (!hasPrivateKey) {
        console.warn('Private key not available - encrypted messages cannot be decrypted');
      }

      const decryptedMessages = await Promise.all(
        messages.map(async (msg) => {
          // CASE 1: I'm the SENDER
          if (msg.senderId === currentUser._id) {
            if (msg.text) {
              return msg;
            } else {
              msg.text = ' [You sent an encrypted message]';
              return msg;
            }
          }
          
          // CASE 2: I'm the RECEIVER
          if (msg.receiverId === currentUser._id) {
            if (msg.isEncrypted && msg.encryptedText) {
              if (hasPrivateKey) {
                try {
                  const decrypted = await encStore.decryptReceivedMessage(
                    msg.encryptedText, 
                    msg.senderId
                  );
                  msg.text = decrypted;
                } catch (error) {
                  console.error('Failed to decrypt message:', error);
                  msg.text = '[Unable to decrypt - encryption error]';
                }
              } else {
                msg.text = '[Encrypted - please log out and log in again]';
              }
            }
          }
          
          return msg;
        })
      );

      set({ messages: decryptedMessages });
    } catch (error) {
      console.error('Error in getMessages:', error);
      toast.error('Failed to load messages');
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // UPDATED: Send message with E2EE
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (!selectedUser) return;
  
    try {
      const { text, image } = messageData;
      const encStore = useEncryptionStore.getState();
  
      let payload = {};
  
      if (text) {
        // Always properly structure encryptedText with the session key included!
        const encrypted = await encStore.encryptMessageForSending(text, selectedUser._id);
  
        if (encrypted.isEncrypted) {
          payload = {
            text: text,
            isEncrypted: true,
            encryptedText: encrypted.encryptedText,
          };
        } else {
          payload = { text, isEncrypted: false };
        }
      }
  
      if (image) {
        payload.image = image;
      }
  
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set({ messages: [...get().messages, res.data] });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast.error('Failed to send message');
    }
  },
  

  //  UPDATED: Subscribe to messages with E2EE handling
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on('newMessage', async (newMessage) => {
      const currentUser = useAuthStore.getState().authUser;
      const encStore = useEncryptionStore.getState();
      
      //  DECRYPT LOGIC - Only decrypt if I'm the receiver
      if (newMessage.isEncrypted && newMessage.encryptedText && newMessage.receiverId === currentUser._id) {
        if (encStore.myPrivateKey) {
          try {
            const decryptedText = await encStore.decryptReceivedMessage(
              newMessage.encryptedText, 
              newMessage.senderId
            );
            newMessage.text = decryptedText;
          } catch (error) {
            console.error('Failed to decrypt received message:', error);
            newMessage.text = '[Unable to decrypt]';
          }
        } else {
          newMessage.text = '[Encrypted - key not available]';
        }
      }

      const appendMessage = () => set({ messages: [...get().messages, newMessage] });

      if (selectedUser && newMessage.senderId === selectedUser._id) {
        appendMessage();
        try {
          if (!newMessage.groupId && currentUser && newMessage.receiverId === currentUser._id) {
            const s = useAuthStore.getState().socket;
            if (s && s.connected) s.emit('messageRead', { messageId: newMessage._id });
          }
        } catch (err) {
          console.warn('Failed to emit messageRead:', err);
        }
      } else {
        appendMessage();
        if (currentUser && newMessage.senderId !== currentUser._id) {
          get().notifyNewMessage(newMessage, { isGroup: false });
        }
        try {
          if (!newMessage.groupId && currentUser && newMessage.receiverId === currentUser._id) {
            const s = useAuthStore.getState().socket;
            if (s && s.connected) s.emit('messageDelivered', { messageId: newMessage._id });
          }
        } catch (err) {
          console.warn('Failed to emit messageDelivered:', err);
        }
      }
    });

    socket.on('messageDelivered', ({ _id, delivered, deliveredAt }) => {
      set({ messages: get().messages.map((m) => (m._id === _id ? { ...m, delivered, deliveredAt } : m)) });
      set({ groupMessages: get().groupMessages.map((m) => (m._id === _id ? { ...m, delivered, deliveredAt } : m)) });
    });

    socket.on('messageRead', ({ _id, read, readAt }) => {
      set({ messages: get().messages.map((m) => (m._id === _id ? { ...m, read, readAt } : m)) });
      set({ groupMessages: get().groupMessages.map((m) => (m._id === _id ? { ...m, read, readAt } : m)) });
    });

    socket.on('messageUpdated', (updated) => {
      set({
        messages: get().messages.map((m) => (m._id === updated._id ? updated : m)),
      });
    });

    socket.on('messageDeleted', ({ _id }) => {
      set({ messages: get().messages.filter((m) => m._id !== _id) });
    });

    socket.on('messageReactionAdded', (updatedMessage) => {
      console.debug('[socket] messageReactionAdded received', updatedMessage);
      if (updatedMessage.groupId) {
        const groupMessages = get().groupMessages || [];
        const updatedMessages = groupMessages.map((m) =>
          m._id === updatedMessage._id ? { ...updatedMessage } : m
        );
        set({ groupMessages: [...updatedMessages] });
      } else {
        const messages = get().messages || [];
        const updatedMessages = messages.map((m) =>
          m._id === updatedMessage._id ? { ...updatedMessage } : m
        );
        set({ messages: [...updatedMessages] });
      }
    });

    socket.on('messageReactionRemoved', (updatedMessage) => {
      console.debug('[socket] messageReactionRemoved received', updatedMessage);
      if (updatedMessage.groupId) {
        const groupMessages = get().groupMessages || [];
        const updatedMessages = groupMessages.map((m) =>
          m._id === updatedMessage._id ? { ...updatedMessage } : m
        );
        set({ groupMessages: [...updatedMessages] });
      } else {
        const messages = get().messages || [];
        const updatedMessages = messages.map((m) =>
          m._id === updatedMessage._id ? { ...updatedMessage } : m
        );
        set({ messages: [...updatedMessages] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off('newMessage');
    socket.off('messageUpdated');
    socket.off('messageDeleted');
    socket.off('messageReactionAdded');
    socket.off('messageReactionRemoved');
  },

  sendVoiceMessage: async ({ audioBlob, duration, recipientId, groupId }) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');
      formData.append('duration', duration.toString());

      let endpoint = '';

      if (groupId) {
        endpoint = `/voice-messages/group/${groupId}`;
      } else if (recipientId) {
        endpoint = `/voice-messages/${recipientId}`;
      } else {
        throw new Error('Either recipientId or groupId must be provided');
      }

      const res = await axiosInstance.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newMessage = res.data;
      console.log('Voice message successfully sent:', newMessage);

      if (groupId) {
        set((state) => ({
          ...state,
          groupMessages: [...state.groupMessages, newMessage],
        }));
      } else {
        set((state) => ({
          ...state,
          messages: [...state.messages, newMessage],
        }));
      }

      return newMessage;
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw new Error(getErrorMessage(error, 'Failed to send voice message'));
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, {
        text: newText,
      });
      set({
        messages: get().messages.map((m) => (m._id === messageId ? res.data : m)),
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to edit message');
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      set({ messages: get().messages.filter((m) => m._id !== messageId) });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete message');
    }
  },

  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get('/groups/my-groups');
      set({ groups: res.data.groups || [] });
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch groups');
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  addGroup: async (groupData) => {
    set({ isGroupCreating: true });
    try {
      const res = await axiosInstance.post('/groups/create', groupData, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(res.data.message || 'Group created successfully!');
      await get().getGroups();
      return res.data.group;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      set({ isGroupCreating: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/group-messages/${groupId}`);
      set({ groupMessages: res.data.messages || [] });
    } catch (error) {
      console.error('Error fetching group messages:', error);
      toast.error(error.response?.data?.message || 'Failed to load group messages');
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  //  UPDATED: Notify new message with E2EE handling
  notifyNewMessage: async (message, { isGroup = false } = {}) => {
    console.debug('[notifyNewMessage] called', {
      messageId: message._id,
      isGroup,
    });
    try {
      const currentUser = useAuthStore.getState().authUser;
      if (!currentUser) return;
      if (message.senderId === currentUser._id) return;

      const sender = get().users.find((u) => u._id === message.senderId) || {};
      const senderName = sender.name || sender.username || 'Someone';
      const title = isGroup
        ? get().groups.find((g) => g._id === message.groupId)?.name || 'Group'
        : senderName;

      let snippet = '';
      if (message.isEncrypted && message.encryptedText) {
        const encStore = useEncryptionStore.getState();
        if (message.receiverId === currentUser._id && encStore.myPrivateKey) {
          try {
            snippet = await encStore.decryptReceivedMessage(
              message.encryptedText, 
              message.senderId
            );
          } catch (e) {
            snippet = '[Encrypted message]';
          }
        } else {
          snippet = '[Encrypted message]';
        }
      } else {
        snippet = message.text || '';
      }

      snippet = String(snippet).replace(/\s+/g, ' ').trim().slice(0, 120);
      const body = isGroup ? `${senderName}: ${snippet}` : snippet;

      console.debug('[notifyNewMessage] showing toast', { title, body });
      if (body) {
        toast.info(`${title} — ${body}`, { duration: 4000 });
      } else {
        toast.info(`${title} — new message`, { duration: 3000 });
      }

      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const showNative = async () => {
            if (Notification.permission === 'granted') {
              const n = new Notification(title, {
                body: body || 'New message',
              });
              n.onclick = () => {
                try {
                  window.focus();
                } catch (e) {}
              };
            } else if (Notification.permission === 'default') {
              const p = await Notification.requestPermission();
              if (p === 'granted') {
                const n = new Notification(title, {
                  body: body || 'New message',
                });
                n.onclick = () => {
                  try {
                    window.focus();
                  } catch (e) {}
                };
              }
            }
          };
          showNative().catch((e) => console.warn('native notification failed', e));
        }
      } catch (e) {
        console.warn('notifyNewMessage: native notification error', e);
      }
    } catch (err) {
      console.error('notifyNewMessage error', err);
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/group-messages/send/${groupId}`, messageData);
    } catch (error) {
      console.error('Error sending group message:', error);
      toast.error(error.response?.data?.message || 'Failed to send group message');
    }
  },

  subscribeToGroupMessages: () => {
    const { selectedGroup } = get();
    if (!selectedGroup) return;
    const socket = useAuthStore.getState().socket;

    socket.emit('joinGroup', selectedGroup._id);

    socket.on('newGroupMessage', (newMessage) => {
      const { groupMessages } = get();
      const currentUser = useAuthStore.getState().authUser;

      const isForSelected = selectedGroup && newMessage.groupId === selectedGroup._id;

      if (newMessage.senderId === currentUser._id) return;

      const exists = groupMessages.some((msg) => msg._id === newMessage._id);
      if (exists) return;

      set({ groupMessages: [...groupMessages, newMessage] });

      if (!isForSelected) {
        get().notifyNewMessage(newMessage, { isGroup: true });
      }
    });

    socket.on('messageReactionAdded', (updatedMessage) => {
      console.debug('[socket] messageReactionAdded received in group', updatedMessage);
      set({
        groupMessages: get().groupMessages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      });
    });

    socket.on('messageReactionRemoved', (updatedMessage) => {
      console.debug('[socket] messageReactionRemoved received in group', updatedMessage);
      set({
        groupMessages: get().groupMessages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off('newGroupMessage');
    socket.off('messageReactionAdded');
    socket.off('messageReactionRemoved');
  },

  addGroupMembers: async (groupId, userIds) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/add-members`,
        { userIds },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(res.data.message || 'Members added successfully!');

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, members: res.data.members } : group
        ),
      }));

      return res.data;
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error.response?.data?.message || 'Failed to add members');
    }
  },

  removeGroupMembers: async (groupId, userIds) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/remove-members`,
        { userIds },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(res.data.message || 'Members removed successfully!');

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, members: res.data.members } : group
        ),
      }));
      return res.data;
    } catch (error) {
      console.error('Error removing members:', error);
      toast.error(error.response?.data?.message || 'Failed to remove members');
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/leave-group`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(res.data.message || 'You have left the group!');
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, members: res.data.members } : group
        ),
      }));

      return res.data;
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  },

  addGroupAdmin: async (groupId, userIds) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/add-admin`,
        { userIds },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(res.data.message || 'Admin added successfully!');

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, admin: res.data.admin } : group
        ),
      }));

      return res.data;
    } catch (error) {
      console.error('Error adding admins:', error);
      toast.error(error.response?.data?.message || 'Failed to add admins');
    }
  },

  removeGroupAdmin: async (groupId, userIds) => {
    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/remove-admin`,
        { userIds },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success(res.data.message || 'Admin removed successfully!');

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, admin: res.data.admin } : group
        ),
      }));

      return res.data;
    } catch (error) {
      console.error('Error removing admins:', error);
      toast.error(error.response?.data?.message || 'Failed to remove admins');
    }
  },

  removeGroupLocally: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g._id !== groupId),
      selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
    })),
}));
