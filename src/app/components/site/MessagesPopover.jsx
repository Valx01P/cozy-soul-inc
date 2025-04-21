'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, ArrowLeft, MoreHorizontal, RefreshCw, MessageCircle } from 'lucide-react';
import useMessageStore from '@/app/stores/messageStore';
import { formatDistanceToNow } from 'date-fns';

const ConversationPreview = ({ conversation, onSelect, active }) => {
  // Format the date to a relative string (e.g. "2 hours ago") with timezone correction
  const formattedDate = conversation.lastMessage?.createdAt
    ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
    : (conversation.createdAt ? formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true }) : '');
  
  return (
    <div 
      className={`p-3 border ${active ? 'border-[var(--primary-red)] bg-red-50' : 'border-gray-200'} rounded-lg hover:bg-gray-50 hover:cursor-pointer transition-colors mb-3`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-start">
        <div className="relative h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0 overflow-hidden">
          {conversation.otherUser?.profileImage ? (
            <Image 
              src={conversation.otherUser.profileImage} 
              alt={conversation.otherUser.name || 'User'}
              fill
              className="object-cover" 
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#FFE5EC] text-[var(--primary-red)]">
              {conversation.otherUser?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <p className="font-medium truncate">
              {conversation.otherUser?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {formattedDate}
            </p>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">
            {conversation.lastMessage ? (
              <>
                <span className={conversation.lastMessage.sentBy === 'you' ? 'text-gray-500' : ''}>
                  {conversation.lastMessage.sentBy === 'you' ? 'You: ' : ''}
                </span>
                {conversation.lastMessage.content}
              </>
            ) : (
              <span className="text-gray-400 italic">No messages yet</span>
            )}
          </p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 truncate max-w-[180px]">
              {conversation.property.title && (
                <>Re: {conversation.property.title}</>
              )}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="bg-[var(--primary-red)] text-white text-xs px-1.5 py-0.5 rounded-full">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isCurrentUser }) => {
  // Convert UTC date to local time for display
  const messageDate = new Date(message.created_at);
  const formattedDate = formatDistanceToNow(messageDate, { addSuffix: true });
  
  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="h-8 w-8 rounded-full mr-2 overflow-hidden flex-shrink-0">
          {message.sender?.profile_image ? (
            <Image 
              src={message.sender.profile_image} 
              alt={message.sender.first_name || 'User'} 
              width={32} 
              height={32} 
              className="object-cover h-full w-full"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-[#FFE5EC] text-[var(--primary-red)] text-sm">
              {message.sender?.first_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      )}
      <div className={`max-w-[75%]`}>
        <div className={`rounded-lg px-3 py-2 ${isCurrentUser 
          ? 'bg-[var(--primary-red)] text-white' 
          : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isCurrentUser 
            ? `You, ${formattedDate}` 
            : `${message.sender?.first_name || 'User'}, ${formattedDate}`
          }
        </p>
      </div>
      {isCurrentUser && (
        <div className="h-8 w-8 rounded-full ml-2 overflow-hidden flex-shrink-0">
          {/* Current user avatar could go here if needed */}
        </div>
      )}
    </div>
  );
};

export default function MessagesPopover({ isOpen, onClose, currentUser }) {
  const [view, setView] = useState('list'); // 'list' or 'conversation'
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const conversationsContainerRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const {
    conversations,
    conversationsLoading,
    conversationsError,
    hasMoreConversations,
    fetchConversations,
    loadMoreConversations,
    refreshConversations,
    
    activeConversation,
    activeConversationMessages,
    messagesLoading,
    messagesError,
    hasMoreMessages,
    setActiveConversation,
    fetchMessages,
    loadMoreMessages,
    refreshMessages,
    
    newMessageText,
    sendingMessage,
    setNewMessageText,
    sendMessage,
    
    unreadConversationsCount
  } = useMessageStore();
  
  // Initial data loading
  useEffect(() => {
    if (isOpen) {
      // If empty or refreshing, fetch conversations
      if (conversations.length === 0 || view === 'list') {
        fetchConversations(1, true);
      }
      
      // Set up the polling interval
      const conversationsInterval = setInterval(() => {
        if (view === 'list') {
          refreshConversations();
        } else if (view === 'conversation' && activeConversation) {
          refreshMessages();
        }
      }, 10000); // Poll every 10 seconds
      
      return () => {
        clearInterval(conversationsInterval);
      };
    }
  }, [isOpen, view, activeConversation]);
  
  // When changing back to conversation list, refresh the list
  useEffect(() => {
    if (view === 'list') {
      fetchConversations(1, true);
    }
  }, [view]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (view === 'conversation' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversationMessages, view]);
  
  // Implement infinite scrolling for conversations
  useEffect(() => {
    if (!conversationsContainerRef.current || !isOpen || view !== 'list') return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = conversationsContainerRef.current;
      
      // Check if user has scrolled to near the top (for pagination)
      if (scrollTop === 0 && hasMoreConversations && !conversationsLoading) {
        setLoadingMore(true);
        loadMoreConversations().finally(() => {
          setLoadingMore(false);
        });
      }
    };
    
    const container = conversationsContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, view, hasMoreConversations, conversationsLoading]);
  
  // Implement infinite scrolling for messages
  useEffect(() => {
    if (!messagesContainerRef.current || !isOpen || view !== 'conversation') return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      
      // Check if user has scrolled to near the top (for pagination)
      if (scrollTop === 0 && hasMoreMessages && !messagesLoading) {
        setLoadingMore(true);
        loadMoreMessages().finally(() => {
          setLoadingMore(false);
          
          // Keep scroll position after loading more
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = 20;
          }
        });
      }
    };
    
    const container = messagesContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, view, hasMoreMessages, messagesLoading]);
  
  // Handle conversation selection
  const handleSelectConversation = (conversationId) => {
    setActiveConversation(conversationId);
    setView('conversation');
  };
  
  // Handle back button
  const handleBack = () => {
    setView('list');
    setActiveConversation(null);
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || sendingMessage) return;
    
    try {
      await sendMessage();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  // Find the active conversation data
  const activeConversationData = conversations.find(conv => conv.id === activeConversation);
  
  if (!isOpen) return null;
  
  return (
    <div className="z-50 absolute top-16 right-4">
      <div 
        className="bg-white shadow-xl flex flex-col w-96 h-[550px] rounded-lg overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            {view === 'conversation' && (
              <button 
                type="button" 
                onClick={handleBack}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-lg font-medium">
              {view === 'list' 
                ? 'Messages' 
                : activeConversationData?.otherUser?.name || 'Conversation'
              }
            </h3>
          </div>
          <div className="flex items-center">
            {view === 'list' && (
              <button 
                type="button"
                onClick={() => refreshConversations()}
                className="mr-3 text-gray-500 hover:text-gray-700"
                disabled={conversationsLoading}
              >
                <RefreshCw size={16} className={conversationsLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Conversation List View */}
        {view === 'list' && (
          <>
            {/* Loading indicator */}
            {conversationsLoading && conversations.length === 0 && (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-red)]"></div>
              </div>
            )}
            
            {/* Error message */}
            {conversationsError && (
              <div className="p-4 text-red-600 text-center">
                <p>Failed to load conversations. Please try again.</p>
                <button 
                  onClick={() => fetchConversations(1, true)}
                  className="mt-2 text-[var(--primary-red)] underline"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Empty state */}
            {!conversationsLoading && !conversationsError && conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 h-full">
                <div className="w-16 h-16 bg-[var(--primary-red)] bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={24} className="text-[var(--primary-red)]" />
                </div>
                <h4 className="text-lg font-medium mb-2">No conversations yet</h4>
                <p className="text-center text-gray-500 mb-4">
                  Visit a property listing and click "Contact Host" to start a conversation.
                </p>
              </div>
            )}
            
            {/* Conversations list */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              ref={conversationsContainerRef}
            >
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary-red)]"></div>
                </div>
              )}
              
              {conversations.map(conversation => (
                <ConversationPreview 
                  key={conversation.id}
                  conversation={conversation}
                  onSelect={handleSelectConversation}
                  active={conversation.id === activeConversation}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Conversation View */}
        {view === 'conversation' && (
          <>
            {/* Loading indicator */}
            {messagesLoading && activeConversationMessages.length === 0 && (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary-red)]"></div>
              </div>
            )}
            
            {/* Error message */}
            {messagesError && (
              <div className="p-4 text-red-600 text-center">
                <p>Failed to load messages. Please try again.</p>
                <button 
                  onClick={() => fetchMessages(activeConversation)}
                  className="mt-2 text-[var(--primary-red)] underline"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Messages container */}
            <div 
              className="flex-1 p-4 overflow-y-auto"
              ref={messagesContainerRef}
            >
              {loadingMore && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary-red)]"></div>
                </div>
              )}
              
              {/* Empty state */}
              {!messagesLoading && !messagesError && activeConversationMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-center text-gray-500">
                    No messages yet. Start the conversation by sending a message below.
                  </p>
                </div>
              )}
              
              {/* Messages */}
              {activeConversationMessages.map(message => (
                <MessageBubble 
                  key={message.id}
                  message={message}
                  isCurrentUser={message.sender?.id === currentUser?.id}
                />
              ))}
              
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input form */}
            <form 
              onSubmit={handleSendMessage}
              className="p-3 border-t border-gray-200 flex items-end"
            >
              <textarea
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-red)] resize-none"
                rows={1}
                style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newMessageText.trim() || sendingMessage}
                className="ml-2 flex-shrink-0 p-2.5 bg-[var(--primary-red)] text-white rounded-full disabled:opacity-50 disabled:bg-gray-400"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}