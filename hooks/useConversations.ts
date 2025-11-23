'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initializedUserId, setInitializedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      // Only clear if we previously had a user
      if (initializedUserId) {
        setConversations([]);
        setInitializedUserId(null);
      }
      setLoading(false);
      return;
    }

    // Skip if we're already initialized for this user
    if (userId === initializedUserId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const setupListener = async () => {
      try {
        // Initial fetch
        const { data, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Convert database format to app format
        const loadedConversations: Conversation[] = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          messages: Array.isArray(row.messages)
            ? (row.messages as any[]).map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
                images: msg.images,
              }))
            : [],
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          modelId: row.model_id,
        }));

        console.log('Loaded conversations from Supabase:', {
          count: loadedConversations.length,
          conversations: loadedConversations.map(c => ({ id: c.id, title: c.title, messageCount: c.messages.length }))
        });
        setConversations(loadedConversations);
        setInitializedUserId(userId);
        setLoading(false);

        // Set up real-time subscription
        channel = supabase
          .channel('conversations')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversations',
              filter: `user_id=eq.${userId}`,
            },
(payload: any) => {
              console.log('Conversation change:', payload.eventType, payload.new?.id);

              if (payload.eventType === 'INSERT') {
                const newConv = payload.new as any;
                setConversations((prev: Conversation[]) => {
                  // Don't add if it already exists
                  if (prev.find(c => c.id === newConv.id)) {
                    return prev;
                  }
                  return [
                    {
                      id: newConv.id,
                      title: newConv.title,
                      messages: Array.isArray(newConv.messages) ? newConv.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                      })) : [],
                      createdAt: new Date(newConv.created_at),
                      updatedAt: new Date(newConv.updated_at),
                      modelId: newConv.model_id,
                    },
                    ...prev,
                  ];
                });
              } else if (payload.eventType === 'UPDATE') {
                const updated = payload.new as any;
                setConversations((prev: Conversation[]) =>
                  prev.map((conv: Conversation) => {
                    if (conv.id !== updated.id) return conv;
                    
                    // Parse incoming messages
                    const incomingMessages = Array.isArray(updated.messages) ? updated.messages.map((msg: any) => ({
                      ...msg,
                      timestamp: new Date(msg.timestamp),
                    })) : [];
                    
                    // If local conversation has more messages (optimistic updates), keep them
                    // This handles the case where we've added messages optimistically
                    console.log('Real-time update for conversation:', updated.id, {
                      localMessages: conv.messages.length,
                      incomingMessages: incomingMessages.length,
                      localIds: conv.messages.map(m => m.id),
                      incomingIds: incomingMessages.map((m: any) => m.id)
                    });
                    
                    const finalMessages = conv.messages.length > incomingMessages.length 
                      ? conv.messages 
                      : incomingMessages;
                      
                    console.log('Final messages count:', finalMessages.length);
                      
                    return {
                      id: updated.id,
                      title: updated.title,
                      messages: finalMessages,
                      createdAt: new Date(updated.created_at),
                      updatedAt: new Date(updated.updated_at),
                      modelId: updated.model_id,
                    };
                  })
                );
              } else if (payload.eventType === 'DELETE') {
                const deleted = payload.old as any;
                setConversations((prev: Conversation[]) => prev.filter((conv: Conversation) => conv.id !== deleted.id));
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error setting up conversations listener:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  // Create a new conversation
  const createConversation = async (modelId: string): Promise<string | null> => {
    if (!userId) {
      console.error('Cannot create conversation: No user ID');
      return null;
    }

    try {
      console.log('Creating conversation for user:', userId);
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: 'New Conversation',
          model_id: modelId,
          messages: [],
        })
        .select()
        .single();

      if (error) throw error;
      console.log('Conversation created successfully:', data.id);
      
      // Immediately add to local state to avoid race condition
      const newConversation: Conversation = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        modelId: data.model_id,
      };
      
      setConversations((prev: Conversation[]) => {
        // Don't add if it already exists (real-time subscription might have added it)
        if (prev.find(c => c.id === data.id)) {
          return prev;
        }
        console.log('Adding new conversation to local state:', data.id);
        return [newConversation, ...prev];
      });
      
      return data.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  };

  // Add a message to a conversation
  const addMessage = async (conversationId: string, message: Message, newTitle?: string): Promise<void> => {
    if (!userId) return;

    // Optimistic update - add message immediately to local state
    console.log('Adding message optimistically:', { conversationId, messageId: message.id, role: message.role });
    setConversations((prev: Conversation[]) => {
      console.log('Current conversations count:', prev.length);
      const conversationExists = prev.find(c => c.id === conversationId);
      if (!conversationExists) {
        console.warn('Conversation not found in local state for optimistic update:', conversationId);
        // Create a minimal conversation entry for optimistic update
        const newConv: Conversation = {
          id: conversationId,
          title: newTitle || 'New Conversation',
          messages: [message],
          createdAt: new Date(),
          updatedAt: new Date(),
          modelId: '',
        };
        return [newConv, ...prev];
      }
      
      const updated = prev.map((conv: Conversation) => {
        if (conv.id === conversationId) {
          console.log('Found conversation, current messages:', conv.messages.length, 'adding message:', message.id);
          return {
            ...conv, 
            messages: [...conv.messages, message],
            title: newTitle || conv.title,
            updatedAt: new Date()
          };
        }
        return conv;
      });
      console.log('Updated conversations with optimistic message');
      return updated;
    });

    try {
      // Get current conversation
      const { data: current, error: fetchError } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Prepare new message
      const cleanMessage = {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        ...(message.images && message.images.length > 0 && { images: message.images }),
      };

      // Append to existing messages
      const updatedMessages = [...(Array.isArray(current.messages) ? current.messages : []), cleanMessage];

      // Update conversation
      const updateData: any = {
        messages: updatedMessages,
      };

      if (newTitle) {
        updateData.title = newTitle;
      }

      const { error: updateError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error adding message:', err);
      // Revert optimistic update on error
      setConversations((prev: Conversation[]) => 
        prev.map((conv: Conversation) => 
          conv.id === conversationId 
            ? {
                ...conv, 
                messages: conv.messages.filter(m => m.id !== message.id),
                title: conv.title // Keep original title if update failed
              }
            : conv
        )
      );
      throw err;
    }
  };

  // Update conversation metadata
  const updateConversation = async (
    conversationId: string,
    updates: Partial<{ title: string; modelId: string }>
  ): Promise<void> => {
    if (!userId) return;

    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.modelId) updateData.model_id = updates.modelId;

      const { error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating conversation:', err);
      throw err;
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string): Promise<void> => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  };

  // Replace all messages in a conversation
  const setMessages = async (conversationId: string, messages: Message[]): Promise<void> => {
    if (!userId) return;

    try {
      const cleanMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        ...(msg.images && msg.images.length > 0 && { images: msg.images }),
      }));

      const { error } = await supabase
        .from('conversations')
        .update({ messages: cleanMessages })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Error setting messages:', err);
      throw err;
    }
  };

  return {
    conversations,
    loading,
    error,
    createConversation,
    addMessage,
    updateConversation,
    deleteConversation,
    setMessages,
  };
}
