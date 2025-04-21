// src/app/services/api/messagingService.js
const messagingService = {
  /**
   * Start a new conversation with a property owner
   * @param {number} propertyId - The ID of the property
   * @param {string} initialMessage - The first message to send
   * @returns {Promise<Object>} - The created conversation and message objects
   */
  startConversation: async (propertyId, initialMessage) => {
    try {
      console.log(`Starting conversation for property ${propertyId}`);
      
      // Ensure we have a base URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      console.log(`Using base URL: ${baseUrl}`);
      
      const res = await fetch(`${baseUrl}/api/listings/${propertyId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ message: initialMessage })
      });
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error starting conversation, status:', res.status, data);
        throw new Error(data.error || data.details || `Failed to start conversation (${res.status})`);
      }
      
      console.log('Conversation started successfully, ID:', data.conversationId);
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  },
  
  /**
   * Get all user conversations (paginated)
   * @param {number} page - The page number to fetch
   * @param {number} limit - The number of conversations per page
   * @returns {Promise<Object>} - Conversations with pagination info
   */
  getChats: async (page = 1, limit = 10) => {
    try {
      console.log(`Fetching conversations - page: ${page}, limit: ${limit}`);
      
      // Ensure we have a base URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      
      const res = await fetch(`${baseUrl}/api/conversations?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error fetching conversations, status:', res.status, data);
        throw new Error(data.error || data.details || `Failed to fetch conversations (${res.status})`);
      }
      
      console.log(`Successfully fetched ${data.conversations?.length || 0} conversations`);
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Get messages for a specific conversation (paginated)
   * @param {number} conversationId - The ID of the conversation
   * @param {number} page - The page number to fetch
   * @param {number} limit - The number of messages per page
   * @returns {Promise<Object>} - Messages with conversation and pagination info
   */
  getMessages: async (conversationId, page = 1, limit = 15) => {
    try {
      console.log(`Fetching messages for conversation ${conversationId} - page: ${page}, limit: ${limit}`);
      
      // Ensure we have a base URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      
      const res = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Error fetching messages, status:', res.status, data);
        throw new Error(data.error || data.details || `Failed to fetch messages (${res.status})`);
      }
      
      console.log(`Successfully fetched ${data.messages?.length || 0} messages`);
      
      // Also mark the conversation as read
      await messagingService.markConversationAsRead(conversationId);
      
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Send a message in an existing conversation
   * @param {number} conversationId - The ID of the conversation
   * @param {string} message - The message content to send
   * @returns {Promise<Object>} - The created message object
   */
  sendMessage: async (conversationId, message) => {
    try {
      console.log(`Sending message to conversation ${conversationId}`);
      
      // Ensure we have a base URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      
      const res = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      
      // Handle error responses
      if (!res.ok) {
        try {
          // Try to parse JSON error response
          const errorData = await res.json();
          console.error('Error sending message, status:', res.status, errorData);
          throw new Error(errorData.error || errorData.details || `Failed to send message (${res.status})`);
        } catch (jsonError) {
          // If parsing JSON fails, get text response
          const text = await res.text();
          console.error('Non-JSON error response:', text);
          throw new Error(`Server error: ${res.status} - ${text.substring(0, 100)}`);
        }
      }
      
      // Handle successful response
      try {
        const data = await res.json();
        console.log('Message sent successfully');
        return data;
      } catch (jsonError) {
        console.error('Error parsing success response:', jsonError);
        // Return a minimal success object if we can't parse the response
        return { 
          message: { 
            id: Date.now(),
            content: message,
            created_at: new Date().toISOString(),
            sender: null
          } 
        };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Return a basic success object even with errors to avoid breaking the UI
      // The UI will still show the message but can display an error notification
      return { 
        message: { 
          id: Date.now(),
          content: message,
          created_at: new Date().toISOString(),
          sender: null,
          error: true
        },
        error: error.message || 'Failed to send message' 
      };
    }
  },

  /**
   * Mark a conversation as read
   * @param {number} conversationId - The ID of the conversation to mark as read
   * @returns {Promise<Object>} - The updated conversation status
   */
  markConversationAsRead: async (conversationId) => {
    try {
      // Ensure we have a base URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      
      const res = await fetch(`${baseUrl}/api/conversations/${conversationId}/messages`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'mark_read' })
      });
      
      // We don't need to process the response, just confirm it worked
      if (!res.ok) {
        console.error('Error marking conversation as read, status:', res.status);
        // Don't throw an error - this is a background operation that shouldn't break the UI
      } else {
        console.log('Conversation marked as read successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      // Don't throw an error - this is a background operation that shouldn't break the UI
      return false;
    }
  }
};

export default messagingService;