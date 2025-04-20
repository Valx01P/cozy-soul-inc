import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

// Using imported supabase client

// GET messages for a specific conversation with pagination
export async function GET(request, { params }) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = params;
    
    // Using imported supabase client
    
    // Check if user is part of this conversation
    const { data: userConv, error: userConvError } = await supabase
      .from('user_conversations')
      .select('conversation_id')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .limit(1);
      
    if (userConvError || !userConv.length) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    
    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
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
      `)
      .eq('id', conversationId)
      .single();
      
    if (convError) {
      return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 });
    }
    
    // Get URL search params for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Get messages for this conversation with pagination
    const { data: messages, error: msgError, count } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, first_name, last_name, profile_image)', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (msgError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
    
    // Get all participants of the conversation
    const { data: participants, error: participantsError } = await supabase
      .from('user_conversations')
      .select('user_id, users:user_id(id, first_name, last_name, profile_image)')
      .eq('conversation_id', conversationId);
      
    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }
    
    // Mark messages as read
    await supabase
      .from('user_conversations')
      .update({ 
        unread_count: 0,
        last_read_message_id: messages.length > 0 ? messages[0].id : null
      })
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId);
    
    const property = conversation.properties;
    
    // Determine the other participants (excluding current user)
    const otherParticipants = participants
      .filter(p => p.user_id !== user.id)
      .map(p => ({
        id: p.users.id,
        name: `${p.users.first_name} ${p.users.last_name}`,
        profileImage: p.users.profile_image
      }));
    
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        property: {
          id: property.id,
          title: property.title,
          image: property.main_image,
          ownerId: property.host_id,
          owner: {
            id: property.host.id,
            name: `${property.host.first_name} ${property.host.last_name}`,
            profileImage: property.host.profile_image
          }
        },
        participants: otherParticipants,
        createdAt: conversation.created_at
      },
      messages,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST to send a new message in a conversation
export async function POST(request, { params }) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = params;
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user is part of this conversation
    const { data: userConv, error: userConvError } = await supabase
      .from('user_conversations')
      .select('conversation_id')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .limit(1);
      
    if (userConvError || !userConv.length) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    
    // Add message
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message
      })
      .select('*, sender:sender_id(id, first_name, last_name, profile_image)')
      .single();
      
    if (messageError) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
    
    // Get other participants to update their unread counts
    const { data: otherParticipants, error: participantsError } = await supabase
      .from('user_conversations')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id);
      
    if (!participantsError && otherParticipants.length) {
      // Increment unread count for all other participants
      const updates = otherParticipants.map(p => ({
        user_id: p.user_id,
        conversation_id: conversationId,
        unread_count: supabase.rpc('increment', { x: 1 })
      }));
      
      await Promise.all(updates.map(update => 
        supabase
          .from('user_conversations')
          .update({ unread_count: supabase.rpc('increment', { x: 1 }) })
          .eq('user_id', update.user_id)
          .eq('conversation_id', update.conversation_id)
      ));
    }
    
    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH to update a conversation (mark as read, hide, etc.)
export async function PATCH(request, { params }) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = params;
    const { action } = await request.json();
    
    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if user is part of this conversation
    const { data: userConv, error: userConvError } = await supabase
      .from('user_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .limit(1);
      
    if (userConvError || !userConv.length) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }
    
    let updateData = {};
    
    switch (action) {
      case 'mark_read':
        updateData = { unread_count: 0 };
        break;
      case 'hide':
        updateData = { is_hidden: true };
        break;
      case 'unhide':
        updateData = { is_hidden: false };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Update user conversation
    const { data: updatedUserConv, error: updateError } = await supabase
      .from('user_conversations')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      action,
      conversation: updatedUserConv
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}