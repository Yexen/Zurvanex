'use client';

import { useState } from 'react';
import type { Conversation } from '@/types';

interface ConversationAnalysisModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export default function ConversationAnalysisModal({ conversation, onClose }: ConversationAnalysisModalProps) {
  const [analysisContent, setAnalysisContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeConversation = async () => {
    setIsAnalyzing(true);
    setAnalysisContent('');

    try {
      // Prepare conversation content for analysis
      const conversationText = conversation.messages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');

      const analysisPrompt = `Analyze this entire conversation comprehensively. Provide insights on:

1. **Conversation Flow & Structure**
   - How the conversation developed
   - Key topics and transitions
   - Communication patterns

2. **Content Analysis**
   - Main themes and subjects discussed
   - Technical accuracy and depth
   - Problem-solving approaches used

3. **User Intent & Goals**
   - What the user was trying to achieve
   - Whether goals were met
   - Unresolved questions or issues

4. **AI Performance**
   - Quality of responses provided
   - Helpfulness and relevance
   - Areas where responses could be improved

5. **Key Insights & Patterns**
   - Notable patterns in the conversation
   - Learning opportunities
   - Suggestions for future similar conversations

6. **Summary & Recommendations**
   - Concise summary of the entire conversation
   - Actionable recommendations for the user
   - Follow-up suggestions

Here is the conversation:

${conversationText}`;

      const response = await fetch('/api/chat/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
          modelId: 'llama-3.3-70b-versatile', // Best Groq model for analysis
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = line.slice(6);
                if (data.trim()) {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    setAnalysisContent((prev) => prev + parsed.content);
                  }
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisContent('Failed to analyze conversation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              color: 'var(--text)',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Conversation Analysis
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              color: 'var(--gray-med)',
              fontSize: '14px'
            }}>
&quot;{conversation.title}&quot; • {conversation.messages.length} messages
            </p>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gray-light)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflow: 'auto'
        }}>
          {!analysisContent && !isAnalyzing && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'var(--primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                opacity: 0.8
              }}>
                <svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 style={{
                margin: '0 0 8px 0',
                color: 'var(--text)',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                Ready to Analyze
              </h4>
              <p style={{
                margin: '0 0 24px 0',
                color: 'var(--gray-med)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Get comprehensive insights about this conversation including themes, patterns, and recommendations.
              </p>
              <button
                onClick={analyzeConversation}
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Start Analysis
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                borderTop: '2px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{
                color: 'var(--text)',
                fontSize: '14px'
              }}>
                Analyzing conversation...
              </span>
            </div>
          )}

          {analysisContent && (
            <div style={{
              background: 'var(--darker-bg)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--gray-light)',
              fontFamily: 'inherit'
            }}>
              {analysisContent}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}