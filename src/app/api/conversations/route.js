import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

// Using imported supabase client

// GET all user conversations with pagination and last message preview
export async function GET(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Using imported supabase client
    
    // Get URL search params for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Get conversations for this user with pagination
    const { data: userConversations, error: convError, count } = await supabase
      .from('user_conversations')
      .select(`
        conversation_id,
        unread_count,
        conversations!inner(
          id,
          property_id,
          created_at,
          properties!inner(
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
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_hidden', false)
      .order('conversations.created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (convError) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
    
    // Get the last message for each conversation
    const conversationIds = userConversations.map(uc => uc.conversation_id);
    
    // Skip if no conversations found
    if (conversationIds.length === 0) {
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
    
    // For each conversation, get the most recent message
    const { data: latestMessages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        content,
        created_at,
        sender:sender_id(
          id,
          first_name,
          last_name
        )
      `)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });
      
    if (msgError) {
      return NextResponse.json({ error: 'Failed to fetch message previews' }, { status: 500 });
    }
    
    // Group messages by conversation_id and get the latest one
    const latestMessagesByConversation = {};
    latestMessages.forEach(msg => {
      if (!latestMessagesByConversation[msg.conversation_id] || 
          new Date(msg.created_at) > new Date(latestMessagesByConversation[msg.conversation_id].created_at)) {
        latestMessagesByConversation[msg.conversation_id] = msg;
      }
    });
    
    // Combine conversation data with latest message
    const conversations = userConversations.map(uc => {
      const conversation = uc.conversations;
      const property = conversation.properties;
      const latestMessage = latestMessagesByConversation[uc.conversation_id] || null;
      
      // Calculate who the other person in the conversation is
      const otherUserId = property.host_id === user.id ? 
        (latestMessage?.sender?.id !== user.id ? latestMessage?.sender?.id : null) : 
        property.host_id;
      
      const otherUser = otherUserId === property.host_id ? 
        property.host : 
        (latestMessage?.sender?.id !== user.id ? latestMessage?.sender : null);
      
      return {
        id: conversation.id,
        property: {
          id: property.id,
          title: property.title,
          image: property.main_image
        },
        otherUser: otherUser ? {
          id: otherUser.id,
          name: `${otherUser.first_name} ${otherUser.last_name}`,
          profileImage: otherUser.profile_image || null
        } : null,
        unreadCount: uc.unread_count,
        lastMessage: latestMessage ? {
          id: latestMessage.id,
          content: latestMessage.content,
          sentBy: latestMessage.sender.id === user.id ? 'you' : `${latestMessage.sender.first_name}`,
          createdAt: latestMessage.created_at
        } : null,
        createdAt: conversation.created_at
      };
    });
    
    return NextResponse.json({
      conversations,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST to create a new conversation (without a property context)
export async function POST(request) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId, receiverId, initialMessage } = await request.json();
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
    }
    
    if (!initialMessage || typeof initialMessage !== 'string' || initialMessage.trim() === '') {
      return NextResponse.json({ error: 'Initial message is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if users exist
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .in('id', [user.id, receiverId]);
      
    if (userError || users.length !== 2) {
      return NextResponse.json({ error: 'One or more users not found' }, { status: 404 });
    }
    
    // Check if property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single();
      
    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Check if conversation already exists
    const { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('property_id', propertyId)
      .filter('id', 'in', (subquery) => {
        return subquery
          .from('user_conversations')
          .select('conversation_id')
          .eq('user_id', user.id);
      })
      .filter('id', 'in', (subquery) => {
        return subquery
          .from('user_conversations')
          .select('conversation_id')
          .eq('user_id', receiverId);
      })
      .limit(1);
    
    let conversationId;
    
    if (existingConv && existingConv.length > 0) {
      // Use existing conversation
      conversationId = existingConv[0].id;
    } else {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({ property_id: propertyId })
        .select()
        .single();
        
      if (createError) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      
      conversationId = newConv.id;
      
      // Add users to conversation
      await supabase.from('user_conversations').insert([
        { user_id: user.id, conversation_id: conversationId },
        { user_id: receiverId, conversation_id: conversationId }
      ]);
    }
    
    // Add initial message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: initialMessage
      })
      .select()
      .single();
      
    if (messageError) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
    
    // Update unread count for receiver
    await supabase
      .from('user_conversations')
      .update({ unread_count: supabase.rpc('increment', { x: 1 }) })
      .eq('user_id', receiverId)
      .eq('conversation_id', conversationId);
    
    return NextResponse.json({ 
      conversationId,
      message: newMessage
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}