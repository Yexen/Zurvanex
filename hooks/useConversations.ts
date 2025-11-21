'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
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

        setConversations(loadedConversations);
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
            (payload) => {
              console.log('Conversation change:', payload);

              if (payload.eventType === 'INSERT') {
                const newConv = payload.new as any;
                setConversations((prev) => [
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
                ]);
              } else if (payload.eventType === 'UPDATE') {
                const updated = payload.new as any;
                setConversations((prev) =>
                  prev.map((conv) =>
                    conv.id === updated.id
                      ? {
                          id: updated.id,
                          title: updated.title,
                          messages: Array.isArray(updated.messages) ? updated.messages.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp),
                          })) : [],
                          createdAt: new Date(updated.created_at),
                          updatedAt: new Date(updated.updated_at),
                          modelId: updated.model_id,
                        }
                      : conv
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                const deleted = payload.old as any;
                setConversations((prev) => prev.filter((conv) => conv.id !== deleted.id));
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
      return data.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  };

  // Add a message to a conversation
  const addMessage = async (conversationId: string, message: Message, newTitle?: string): Promise<void> => {
    if (!userId) return;

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
