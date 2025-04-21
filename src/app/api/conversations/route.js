import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

// GET all user conversations with pagination and last message preview
export async function GET(request) {
  try {
    console.log("Conversations GET route called");
    
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      console.log("Unauthorized: No user found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`User authenticated: ${user.id}`);
    
    // Get URL search params for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    console.log(`Fetching conversations - page: ${page}, limit: ${limit}, offset: ${offset}`);
    
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_conversations')
      .select('conversation_id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_hidden', false);
      
    if (countError) {
      console.error("Count query error:", countError);
      return NextResponse.json({ 
        error: 'Failed to count conversations',
        details: countError.message 
      }, { status: 500 });
    }
    
    const total = count || 0;
    console.log(`Total conversations: ${total}`);
    
    // Return empty array if no conversations found
    if (total === 0) {
      return NextResponse.json({
        conversations: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      }, { status: 200 });
    }
    
    // Get user's conversations with pagination
    const { data: userConversations, error: conversationsError } = await supabase
      .from('user_conversations')
      .select(`
        unread_count,
        conversation_id,
        conversations:conversation_id(
          id,
          property_id,
          created_at,
          properties:property_id(
            id, 
            title,
            main_image,
            host_id,
            host:host_id(
              id,
              first_name,
              last_name,
              profile_image
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_hidden', false)
      .order('conversation_id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError);
      return NextResponse.json({ 
        error: 'Failed to fetch conversations',
        details: conversationsError.message 
      }, { status: 500 });
    }
    
    console.log(`Fetched ${userConversations?.length || 0} conversations`);
    
    // Get the last message for each conversation using direct query instead of RPC
    const conversationIds = userConversations.map(uc => uc.conversation_id);
    
    // Query for last messages directly instead of using RPC
    const { data: lastMessages, error: lastMsgError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        created_at
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });
      
    if (lastMsgError) {
      console.error("Error fetching last messages:", lastMsgError);
      // Continue without last messages
    }
    
    // Create a map of conversation ID to last message
    const lastMessageMap = {};
    if (lastMessages) {
      // For each conversation, find the latest message
      conversationIds.forEach(convId => {
        const messagesForConv = lastMessages.filter(msg => msg.conversation_id === convId);
        if (messagesForConv.length > 0) {
          // Sort by created_at in descending order to get the most recent message
          messagesForConv.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          lastMessageMap[convId] = messagesForConv[0];
        }
      });
    }
    
    // Get all participants for each conversation
    const { data: allParticipants, error: participantsError } = await supabase
      .from('user_conversations')
      .select(`
        conversation_id,
        user_id,
        users:user_id(
          id,
          first_name,
          last_name,
          profile_image
        )
      `)
      .in('conversation_id', conversationIds);
      
    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      // Continue without participants
    }
    
    // Group participants by conversation
    const participantMap = {};
    if (allParticipants) {
      allParticipants.forEach(p => {
        if (!participantMap[p.conversation_id]) {
          participantMap[p.conversation_id] = [];
        }
        participantMap[p.conversation_id].push({
          id: p.users.id,
          name: `${p.users.first_name} ${p.users.last_name}`,
          profileImage: p.users.profile_image
        });
      });
    }
    
    // Build the response data
    const conversations = userConversations.map(uc => {
      const conversation = uc.conversations;
      const property = conversation.properties;
      
      // Find other participants (not the current user)
      const participants = participantMap[conversation.id] || [];
      const otherParticipants = participants.filter(p => p.id !== user.id);
      
      // Get the other user info - prioritize using actual participants
      let otherUser = null;
      if (otherParticipants.length > 0) {
        // Use the first participant that's not the current user
        const otherParticipant = otherParticipants[0];
        otherUser = {
          id: otherParticipant.id,
          name: otherParticipant.name || 'Unknown User',
          profileImage: otherParticipant.profileImage
        };
      } else if (property && property.host) {
        // Fallback to the property host information
        otherUser = {
          id: property.host.id,
          name: `${property.host.first_name} ${property.host.last_name}`,
          profileImage: property.host.profile_image
        };
      } else {
        // Provide a default if no user info is available
        otherUser = {
          id: 0,
          name: 'Property Owner',
          profileImage: null
        };
      }
      
      // Format the last message 
      let lastMessage = null;
      const lastMsg = lastMessageMap[conversation.id];
      if (lastMsg) {
        // Format the timestamp as local time for consistent display
        lastMessage = {
          content: lastMsg.content,
          createdAt: lastMsg.created_at,
          sentBy: lastMsg.sender_id === user.id ? 'you' : 'other'
        };
      }
      
      return {
        id: conversation.id,
        createdAt: conversation.created_at,
        property: {
          id: property?.id || 0,
          title: property?.title || 'Unknown Property',
          image: property?.main_image || null
        },
        otherUser,
        unreadCount: uc.unread_count || 0,
        lastMessage
      };
    });
    
    return NextResponse.json({
      conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Fatal error in conversations route:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || error.toString()
    }, { status: 500 });
  }
}

// POST to create a new conversation with property owner
export async function POST(request) {
  try {
    console.log("Conversations POST route called");
    
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      console.log("Unauthorized: No user found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`User authenticated: ${user.id}`);
    
    const requestData = await request.json();
    console.log("Request data:", requestData);
    
    const { propertyId, initialMessage } = requestData;
    const receiverId = requestData.receiverId;
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    if (!initialMessage || typeof initialMessage !== 'string' || initialMessage.trim() === '') {
      return NextResponse.json({ error: 'Initial message is required' }, { status: 400 });
    }
    
    try {
      // If receiverId not provided, get the property host
      let hostId = receiverId;
      
      if (!hostId) {
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('host_id')
          .eq('id', propertyId)
          .single();
          
        if (propertyError) {
          console.error("Error fetching property:", propertyError);
          return NextResponse.json({ 
            error: 'Failed to fetch property information',
            details: propertyError.message 
          }, { status: 500 });
        }
        
        hostId = property.host_id;
      }
      
      if (hostId === user.id) {
        return NextResponse.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 });
      }
      
      console.log(`Creating conversation between user ${user.id} and host ${hostId} for property ${propertyId}`);
      
      // Check if a conversation already exists for this property between these users
      const { data: existingConversations, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId);
        
      if (checkError) {
        console.error("Error checking existing conversations:", checkError);
        return NextResponse.json({ 
          error: 'Failed to check existing conversations',
          details: checkError.message 
        }, { status: 500 });
      }
      
      let existingConversationId = null;
      
      if (existingConversations && existingConversations.length > 0) {
        // For each conversation, check if both user and host are participants
        for (const conv of existingConversations) {
          const { data: participants, error: partError } = await supabase
            .from('user_conversations')
            .select('user_id')
            .eq('conversation_id', conv.id);
            
          if (partError) {
            console.error(`Error checking participants for conversation ${conv.id}:`, partError);
            continue;
          }
          
          const userIds = participants.map(p => p.user_id);
          if (userIds.includes(user.id) && userIds.includes(hostId)) {
            existingConversationId = conv.id;
            break;
          }
        }
      }
      
      let conversationId;
      
      if (existingConversationId) {
        // Use existing conversation
        conversationId = existingConversationId;
        console.log(`Using existing conversation: ${conversationId}`);
      } else {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert({ property_id: propertyId })
          .select()
          .single();
          
        if (convError) {
          console.error("Error creating conversation:", convError);
          return NextResponse.json({ 
            error: 'Failed to create conversation',
            details: convError.message 
          }, { status: 500 });
        }
        
        conversationId = newConversation.id;
        console.log(`Created conversation with ID: ${conversationId}`);
        
        // Add users to conversation
        const { error: userConvError } = await supabase
          .from('user_conversations')
          .insert([
            { user_id: user.id, conversation_id: conversationId, unread_count: 0 },
            { user_id: hostId, conversation_id: conversationId, unread_count: 1 }
          ]);
          
        if (userConvError) {
          console.error("Error adding users to conversation:", userConvError);
          return NextResponse.json({ 
            error: 'Failed to set up conversation participants',
            details: userConvError.message 
          }, { status: 500 });
        }
      }
      
      // Use client's local time and convert to ISO format for storage
      const now = new Date().toISOString();
      
      // Add initial message with explicit timestamp
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: initialMessage,
          created_at: now
        })
        .select()
        .single();
        
      if (messageError) {
        console.error("Error creating message:", messageError);
        return NextResponse.json({ 
          error: 'Failed to create message',
          details: messageError.message 
        }, { status: 500 });
      }
      
      // If using existing conversation, update unread count for host
      if (existingConversationId) {
        const { error: updateError } = await supabase
          .from('user_conversations')
          .update({ unread_count: supabase.sql`unread_count + 1` })
          .eq('user_id', hostId)
          .eq('conversation_id', conversationId);
        
        if (updateError) {
          console.error("Error updating unread count:", updateError);
          // Continue anyway
        }
      }
      
      console.log("Successfully created conversation with initial message");
      
      return NextResponse.json({ 
        conversationId,
        message: newMessage
      }, { status: 201 });
      
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError.message || dbError.toString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Fatal error in conversations POST route:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || error.toString()
    }, { status: 500 });
  }
}