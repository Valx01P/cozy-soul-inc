import { NextResponse } from 'next/server';
import { getLoggedInUser } from '@/app/lib/auth';
import supabase from '@/app/services/supabase';

/*
lets you start a new message conversation with the
admin (owner) of the listing
*/
export async function POST(request, { params }) {
  try {
    console.log("POST to listing messages route called");
    
    // Get the current user
    const user = await getLoggedInUser();
    if (!user) {
      console.log("Unauthorized: No user found");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: propertyId } = await params;
    console.log(`Property ID: ${propertyId}, User ID: ${user.id}`);
    
    try {
      const body = await request.json();
      const { message } = body;
      
      console.log(`Message content: ${message ? message.substring(0, 20) + '...' : 'EMPTY'}`);
      
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }
      
      // Get property owner
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('host_id, title')
        .eq('id', propertyId)
        .single();
        
      if (propertyError) {
        console.error("Error fetching property:", propertyError);
        return NextResponse.json({ 
          error: 'Property not found',
          details: propertyError.message 
        }, { status: 404 });
      }
      
      const hostId = property.host_id;
      console.log(`Host ID: ${hostId}`);
      
      if (hostId === user.id) {
        return NextResponse.json({ error: 'Cannot message yourself as property owner' }, { status: 400 });
      }
      
      // Check if conversation already exists for this property and these users
      console.log("Checking for existing conversation...");
      
      // First, find all conversations for this property
      const { data: propertyConversations, error: propConvError } = await supabase
        .from('conversations')
        .select('id')
        .eq('property_id', propertyId);
        
      if (propConvError) {
        console.error("Error checking property conversations:", propConvError);
        return NextResponse.json({ 
          error: 'Error checking existing conversations',
          details: propConvError.message 
        }, { status: 500 });
      }
      
      let existingConvId = null;
      
      if (propertyConversations && propertyConversations.length > 0) {
        console.log(`Found ${propertyConversations.length} conversations for this property`);
        
        // For each conversation, check if both user and host are participants
        for (const conv of propertyConversations) {
          // Get all participants for this conversation
          const { data: participants, error: partError } = await supabase
            .from('user_conversations')
            .select('user_id')
            .eq('conversation_id', conv.id);
            
          if (partError) {
            console.error(`Error checking participants for conversation ${conv.id}:`, partError);
            continue;
          }
          
          // Convert to array of user IDs
          const userIds = participants.map(p => p.user_id);
          
          // Check if both current user and host are participants
          if (userIds.includes(user.id) && userIds.includes(hostId)) {
            existingConvId = conv.id;
            console.log(`Found existing conversation: ${existingConvId}`);
            break;
          }
        }
      }
      
      let conversationId;
      
      if (existingConvId) {
        // Use existing conversation
        conversationId = existingConvId;
        console.log(`Using existing conversation: ${conversationId}`);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({ property_id: propertyId })
          .select()
          .single();
          
        if (createError) {
          console.error("Error creating conversation:", createError);
          return NextResponse.json({ 
            error: 'Failed to create conversation',
            details: createError.message 
          }, { status: 500 });
        }
        
        conversationId = newConv.id;
        console.log(`Created new conversation: ${conversationId}`);
        
        // Add users to conversation with initial unread count
        const { error: joinError } = await supabase
          .from('user_conversations')
          .insert([
            { user_id: user.id, conversation_id: conversationId, unread_count: 0 },
            { user_id: hostId, conversation_id: conversationId, unread_count: 1 }
          ]);
        
        if (joinError) {
          console.error("Error adding users to conversation:", joinError);
          return NextResponse.json({ 
            error: 'Failed to add users to conversation',
            details: joinError.message 
          }, { status: 500 });
        }
      }
      
      // Add message with explicit timestamp
      console.log(`Adding message to conversation ${conversationId}`);
      
      // Use client's local time in ISO format for consistent timestamps
      const now = new Date().toISOString();
      
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message,
          created_at: now
        })
        .select('*, sender:sender_id(id, first_name, last_name, profile_image)')
        .single();
        
      if (messageError) {
        console.error("Error creating message:", messageError);
        return NextResponse.json({ 
          error: 'Failed to create message',
          details: messageError.message 
        }, { status: 500 });
      }
      
      // Update unread count for host if using existing conversation
      if (existingConvId) {
        console.log(`Updating unread count for host ${hostId}`);
        
        // Increment the unread count for the host
        const { error: updateError } = await supabase
          .from('user_conversations')
          .update({ unread_count: supabase.sql`unread_count + 1` })
          .eq('user_id', hostId)
          .eq('conversation_id', conversationId);
          
        if (updateError) {
          console.error("Error updating unread count:", updateError);
          // Continue anyway since the message was created successfully
        }
      }
      
      console.log("Successfully created/sent message");
      
      return NextResponse.json({ 
        message: newMessage,
        conversationId,
        propertyTitle: property.title
      }, { status: 201 });
    } catch (error) {
      console.error("Error processing request:", error);
      return NextResponse.json({ 
        error: 'Error processing request',
        details: error.message || error.toString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Fatal error in listings message route:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || error.toString()
    }, { status: 500 });
  }
}