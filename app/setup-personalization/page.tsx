'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { indexPersonalizationText, getIndexingStatus } from '@/lib/personalizationIndexer';

export default function SetupPersonalizationPage() {
  const { user } = useAuth();
  const [personalizationText, setPersonalizationText] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<{ chunksCreated: number; entitiesExtracted: number } | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    if (!user) return;
    try {
      const statusData = await getIndexingStatus(user.id);
      setStatus(statusData);
    } catch (err) {
      console.error('Error loading status:', err);
    }
  };

  const handleIndex = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    if (!personalizationText.trim()) {
      setError('Please enter your personalization text');
      return;
    }

    try {
      setIndexing(true);
      setError(null);
      setProgress('Starting indexing...');

      const indexResult = await indexPersonalizationText(
        personalizationText,
        user.id,
        {
          openrouter: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
          openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        },
        (progressUpdate) => {
          setProgress(progressUpdate.message);
        }
      );

      setResult(indexResult);
      setProgress('✅ Indexing complete!');
      await loadStatus();
    } catch (err: any) {
      console.error('Indexing error:', err);
      setError(err.message || 'Failed to index personalization');
    } finally {
      setIndexing(false);
    }
  };

  // Load status on mount
  useState(() => {
    loadStatus();
  });

  const exampleText = `=== CORE IDENTITY ===
My name is [Your Name]. I'm a [occupation] living in [location].
I'm [age] years old. My pronouns are [pronouns].

=== RELATIONSHIPS ===
My partner [Name] is [description]...
My pet [Name] is [description]...

=== PROJECTS ===
I'm working on [Project Name], which is [description]...

=== EDUCATION ===
I studied at [University Name]...

=== INTERESTS ===
I'm passionate about [interests]...`;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center" style={{ color: 'var(--gray-med)' }}>
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p>You need to be signed in to set up personalization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg-dark)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--gray-med)' }}>
          Setup Smart Search
        </h1>
        <p className="mb-8" style={{ color: 'var(--gray-light)' }}>
          Index your personalization data for intelligent context retrieval
        </p>

        {/* Current Status */}
        {status && (
          <div className="mb-6 p-4 rounded-lg" style={{
            background: 'var(--darker-bg)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--gray-med)' }}>
              Current Status
            </h2>
            <div className="space-y-1 text-sm" style={{ color: 'var(--gray-light)' }}>
              <div>Indexed: {status.isIndexed ? '✅ Yes' : '❌ No'}</div>
              <div>Chunks: {status.chunkCount}</div>
              <div>Entities: {status.entityCount}</div>
              <div>Embeddings: {status.hasEmbeddings ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171'
          }}>
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mb-4 p-4 rounded-lg" style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80'
          }}>
            ✅ Successfully indexed!
            <div className="mt-2 text-sm">
              Created {result.chunksCreated} chunks, extracted {result.entitiesExtracted} entities
            </div>
          </div>
        )}

        {/* Progress */}
        {indexing && (
          <div className="mb-4 p-4 rounded-lg" style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa'
          }}>
            {progress}
          </div>
        )}

        {/* Example */}
        <div className="mb-4">
          <button
            onClick={() => setPersonalizationText(exampleText)}
            className="text-sm px-3 py-1 rounded transition-colors"
            style={{
              color: 'var(--teal-bright)',
              background: 'rgba(114, 212, 204, 0.1)',
              border: '1px solid rgba(114, 212, 204, 0.3)'
            }}
          >
            Load Example Template
          </button>
        </div>

        {/* Personalization Text Input */}
        <div className="mb-6">
          <label className="block mb-2 font-medium" style={{ color: 'var(--gray-med)' }}>
            Your Personalization Text
          </label>
          <textarea
            value={personalizationText}
            onChange={(e) => setPersonalizationText(e.target.value)}
            placeholder="Enter your personalization data here..."
            disabled={indexing}
            rows={20}
            className="w-full px-4 py-3 rounded-lg font-mono text-sm"
            style={{
              background: 'var(--darker-bg)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--gray-med)',
              resize: 'vertical'
            }}
          />
          <p className="mt-2 text-xs" style={{ color: 'var(--gray-light)' }}>
            Include facts about yourself, relationships, projects, education, interests, etc.
          </p>
        </div>

        {/* Index Button */}
        <button
          onClick={handleIndex}
          disabled={indexing || !personalizationText.trim()}
          className="w-full py-3 px-4 rounded-lg font-medium transition-all"
          style={{
            background: indexing ? 'rgba(114, 212, 204, 0.5)' : 'var(--teal-bright)',
            color: '#1f1f1f',
            cursor: indexing || !personalizationText.trim() ? 'not-allowed' : 'pointer',
            opacity: indexing || !personalizationText.trim() ? 0.5 : 1
          }}
        >
          {indexing ? 'Indexing...' : 'Index Personalization'}
        </button>

        {/* Info */}
        <div className="mt-6 p-4 rounded-lg text-sm" style={{
          background: 'var(--darker-bg)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'var(--gray-light)'
        }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--gray-med)' }}>
            How it works:
          </h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Splits your text into searchable chunks</li>
            <li>Extracts entities (names, places, brands, etc.) using AI</li>
            <li>Builds entity index for instant factual answers</li>
            <li>Generates embeddings for semantic search (optional)</li>
            <li>Cost: ~$0.00 per indexing (uses free Gemini)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
