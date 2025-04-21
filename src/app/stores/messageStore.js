'use client';

import { create } from 'zustand';
import messagingService from '@/app/services/api/messagingService';

const useMessageStore = create((set, get) => ({
  // Conversations state
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  hasMoreConversations: true,
  conversationsPage: 1,
  conversationsLimit: 10,
  unreadConversationsCount: 0,
  
  // Active conversation state
  activeConversation: null,
  activeConversationMessages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: true,
  messagesPage: 1,
  messagesLimit: 15,
  
  // New message state
  newMessageText: '',
  sendingMessage: false,
  
  // Set active conversation
  setActiveConversation: async (conversationId) => {
    set({ 
      activeConversation: conversationId,
      activeConversationMessages: [],
      messagesPage: 1,
      hasMoreMessages: true,
      messagesError: null
    });
    
    if (conversationId) {
      await get().fetchMessages(conversationId);
    }
  },
  
  // Fetch messages for active conversation
  fetchMessages: async (conversationId, page = 1) => {
    try {
      if (!conversationId || get().messagesLoading) return;
      
      set({ 
        messagesLoading: true, 
        messagesError: null,
        messagesPage: page
      });
      
      const response = await messagingService.getMessages(
        conversationId, 
        page, 
        get().messagesLimit
      );
      
      // Update read status for this conversation
      const updatedConversations = get().conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
      
      // Calculate total unread conversations
      let unreadCount = 0;
      updatedConversations.forEach(conv => {
        if (conv.unreadCount > 0) unreadCount++;
      });
      
      set(state => ({
        activeConversationMessages: page === 1 
          ? response.messages 
          : [...state.activeConversationMessages, ...response.messages],
        conversations: updatedConversations,
        hasMoreMessages: response.pagination.page < response.pagination.totalPages,
        messagesLoading: false,
        unreadConversationsCount: unreadCount
      }));
      
      return response;
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ 
        messagesLoading: false, 
        messagesError: error.message || 'Failed to fetch messages'
      });
      throw error;
    }
  },
  
  // Load more messages (pagination)
  loadMoreMessages: async () => {
    if (!get().activeConversation || !get().hasMoreMessages || get().messagesLoading) return;
    
    const nextPage = get().messagesPage + 1;
    const result = await get().fetchMessages(get().activeConversation, nextPage);
    return result;
  },
  
  // Refresh messages for active conversation
  refreshMessages: async () => {
    if (!get().activeConversation) return;
    return get().fetchMessages(get().activeConversation, 1);
  },
  
  // Update message text input
  setNewMessageText: (text) => {
    set({ newMessageText: text });
  },
  
  // Send a message in the active conversation
  sendMessage: async () => {
    const { activeConversation, newMessageText } = get();
    
    if (!activeConversation || !newMessageText.trim()) return;
    
    try {
      set({ sendingMessage: true });
      
      const response = await messagingService.sendMessage(activeConversation, newMessageText);
      
      // Create a date object in the client's timezone
      if (!response.message.created_at) {
        response.message.created_at = new Date().toISOString();
      }
      
      // Add the new message to the conversation
      set(state => ({
        activeConversationMessages: [response.message, ...state.activeConversationMessages],
        newMessageText: '',
        sendingMessage: false
      }));
      
      // Update the conversation preview
      get().updateConversationPreview(activeConversation, response.message);
      
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      set({ 
        sendingMessage: false,
        messagesError: error.message || 'Failed to send message'
      });
      throw error;
    }
  },
  
  // Update a conversation preview with the latest message
  updateConversationPreview: (conversationId, message) => {
    set(state => ({
      conversations: state.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              createdAt: message.created_at || new Date().toISOString(),
              sentBy: 'you'
            }
          };
        }
        return conv;
      })
    }));
  },
  
  // Fetch all conversations (for inbox)
  fetchConversations: async (page = 1, reset = false) => {
    try {
      if (get().conversationsLoading) return;
      
      set({ 
        conversationsLoading: true, 
        conversationsError: null,
        conversationsPage: page
      });
      
      const response = await messagingService.getChats(page, get().conversationsLimit);
      
      // Process conversations to add otherUser and format lastMessage
      const processedConversations = response.conversations.map(conv => {
        // Ensure otherUser exists in the conversation objects
        const otherUser = conv.otherUser || { 
          id: 0, 
          name: 'Unknown User', 
          profileImage: null 
        };
        
        // Determine if the last message was sent by the current user or the other person
        let lastMessageObj = null;
        if (conv.lastMessage) {
          const sentByUser = conv.lastMessage.sentBy === 'you';
          lastMessageObj = {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            sentBy: sentByUser ? 'you' : 'other'
          };
        }
        
        return {
          ...conv,
          otherUser,
          lastMessage: lastMessageObj
        };
      });
      
      // Calculate total unread conversations
      let unreadCount = 0;
      processedConversations.forEach(conv => {
        if (conv.unreadCount > 0) unreadCount++;
      });
      
      set(state => ({
        conversations: reset ? processedConversations : [...state.conversations, ...processedConversations],
        hasMoreConversations: response.pagination.page < response.pagination.totalPages,
        conversationsLoading: false,
        unreadConversationsCount: unreadCount
      }));
      
      return response;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      set({ 
        conversationsLoading: false, 
        conversationsError: error.message || 'Failed to fetch conversations'
      });
      throw error;
    }
  },
  
  // Load more conversations (pagination)
  loadMoreConversations: async () => {
    if (!get().hasMoreConversations || get().conversationsLoading) return;
    
    const nextPage = get().conversationsPage + 1;
    const result = await get().fetchConversations(nextPage);
    return result;
  },
  
  // Start a new conversation with a property owner about a specific listing
  startConversation: async (propertyId, initialMessage) => {
    if (!propertyId || !initialMessage.trim()) return;
    
    try {
      set({ sendingMessage: true });
      
      console.log(`Starting conversation for property ${propertyId} with message: ${initialMessage.substring(0, 20)}...`);
      
      const response = await messagingService.startConversation(propertyId, initialMessage);
      
      console.log('Conversation started successfully:', response.conversationId);
      
      // Refresh conversations to include the new one
      await get().refreshConversations();
      
      // Set the new conversation as active
      await get().setActiveConversation(response.conversationId);
      
      set({ sendingMessage: false });
      
      return response;
    } catch (error) {
      console.error('Error starting conversation:', error);
      set({ 
        sendingMessage: false, 
        messagesError: error.message || 'Failed to start conversation'
      });
      throw error;
    }
  },
  
  // Simple function to refresh conversations
  refreshConversations: async () => {
    return get().fetchConversations(1, true);
  },
  
  // Clear error states
  clearErrors: () => {
    set({ 
      conversationsError: null,
      messagesError: null
    });
  }
}));

export default useMessageStore;