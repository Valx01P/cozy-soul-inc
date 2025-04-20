import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

// Using imported supabase client

/*
gets all your messages from a listing
*/
export async function GET(request, { params }) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = params;
    
    // Using imported supabase client
    
    // Get conversation for this property that the user is part of
    const { data: userConversations, error: convError } = await supabase
      .from('user_conversations')
      .select(`
        conversation_id,
        conversations!inner(
          id,
          property_id
        )
      `)
      .eq('user_id', user.id)
      .eq('conversations.property_id', propertyId)
      .limit(1);
      
    if (convError) {
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }
    
    if (!userConversations.length) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }
    
    const conversationId = userConversations[0].conversation_id;
    
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
    
    // Mark messages as read
    await supabase
      .from('user_conversations')
      .update({ 
        unread_count: 0,
        last_read_message_id: messages.length > 0 ? messages[0].id : null
      })
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId);
    
    return NextResponse.json({
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

/*
lets you start a new message conversation with the
admin (owner) of the listing
*/
export async function POST(request, { params }) {
  try {
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = params;
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get property owner
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('host_id')
      .eq('id', propertyId)
      .single();
      
    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    const hostId = property.host_id;
    
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
      
      // Add user to conversation
      await supabase.from('user_conversations').insert([
        { user_id: user.id, conversation_id: conversationId },
        { user_id: hostId, conversation_id: conversationId }
      ]);
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
    
    // Update unread count for property owner
    await supabase
      .from('user_conversations')
      .update({ unread_count: supabase.rpc('increment', { x: 1 }) })
      .eq('user_id', hostId)
      .eq('conversation_id', conversationId);
    
    return NextResponse.json({ 
      message: newMessage,
      conversationId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}