'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { hardMemorySupabase } from '@/lib/hardMemorySupabase';
import type { Memory } from '@/types/memory';

export default function SplitMemoryPage() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemories();
  }, [user]);

  const loadMemories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const allMemories = await hardMemorySupabase.getAllMemories(user.id);
      // Sort by size (largest first)
      allMemories.sort((a, b) => b.content.length - a.content.length);
      setMemories(allMemories);
    } catch (err) {
      console.error('Error loading memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const splitMemory = async () => {
    if (!selectedMemory || !user) return;

    try {
      setSplitting(true);
      setResult('Analyzing memory content...');

      const content = selectedMemory.content;
      const sections = smartSplit(content);

      setResult(`Found ${sections.length} sections. Creating memories...\n`);

      let created = 0;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        try {
          await hardMemorySupabase.saveMemory({
            title: `${selectedMemory.title} - Part ${i + 1}: ${section.title}`,
            content: section.content,
            tags: [...selectedMemory.tags, 'split-from-large-file'],
            folderId: selectedMemory.folderId,
            userId: user.id,
          });
          created++;
          setResult(prev => prev + `✅ Created: Part ${i + 1} (${section.content.length} chars)\n`);
        } catch (err) {
          setResult(prev => prev + `❌ Failed: Part ${i + 1}\n`);
          console.error('Error creating section:', err);
        }
      }

      setResult(prev => prev + `\n✅ Successfully created ${created}/${sections.length} new memories!\n`);
      setResult(prev => prev + `\n⚠️ Original memory "${selectedMemory.title}" is still there. Delete it manually if you want.`);

      // Reload memories
      await loadMemories();
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
      console.error('Error splitting:', err);
    } finally {
      setSplitting(false);
    }
  };

  const smartSplit = (content: string): Array<{ title: string; content: string }> => {
    const sections: Array<{ title: string; content: string }> = [];

    // Try to split by headers (=== HEADER ===)
    const headerPattern = /===\s*([^=]+?)\s*===/g;
    const matches = [...content.matchAll(headerPattern)];

    if (matches.length > 0) {
      // Split by headers
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const title = match[1].trim();
        const startIdx = match.index! + match[0].length;
        const endIdx = matches[i + 1]?.index || content.length;
        const sectionContent = content.slice(startIdx, endIdx).trim();

        if (sectionContent.length > 100) {
          // If section is still too large, split it further
          if (sectionContent.length > 15000) {
            const subSections = splitByParagraphs(sectionContent, 10000);
            subSections.forEach((subContent, idx) => {
              sections.push({
                title: `${title} (${idx + 1})`,
                content: subContent,
              });
            });
          } else {
            sections.push({
              title: title,
              content: sectionContent,
            });
          }
        }
      }
    } else {
      // No headers found, split by size
      const chunks = splitByParagraphs(content, 10000);
      chunks.forEach((chunk, idx) => {
        sections.push({
          title: `Section ${idx + 1}`,
          content: chunk,
        });
      });
    }

    return sections;
  };

  const splitByParagraphs = (text: string, maxSize: number): string[] => {
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if (currentChunk.length + para.length > maxSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        // If single paragraph is too large, split by sentences
        if (para.length > maxSize) {
          const sentences = para.split('. ');
          for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxSize) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
              }
            }
            currentChunk += sentence + '. ';
          }
        } else {
          currentChunk = para + '\n\n';
        }
      } else {
        currentChunk += para + '\n\n';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
        <div className="text-center" style={{ color: 'var(--gray-med)' }}>
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg-dark)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--gray-med)' }}>
          Split Large Memory
        </h1>
        <p className="mb-8" style={{ color: 'var(--gray-light)' }}>
          Split large memory files into smaller, searchable chunks
        </p>

        {loading ? (
          <div style={{ color: 'var(--gray-light)' }}>Loading memories...</div>
        ) : (
          <>
            {/* Memory List */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-med)' }}>
                Select Memory to Split
              </h2>
              <div className="space-y-2">
                {memories.map(memory => (
                  <div
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className="p-4 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: selectedMemory?.id === memory.id ? 'rgba(114, 212, 204, 0.1)' : 'var(--darker-bg)',
                      border: `1px solid ${selectedMemory?.id === memory.id ? 'var(--teal-bright)' : 'rgba(255, 255, 255, 0.1)'}`,
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: 'var(--gray-med)' }}>
                          {memory.title}
                        </div>
                        <div className="text-sm mt-1" style={{ color: 'var(--gray-light)' }}>
                          {memory.content.substring(0, 100)}...
                        </div>
                      </div>
                      <div className="ml-4 text-sm" style={{
                        color: memory.content.length > 20000 ? '#f87171' : 'var(--gray-light)'
                      }}>
                        {(memory.content.length / 1000).toFixed(1)}KB
                        {memory.content.length > 20000 && ' ⚠️'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Memory Info */}
            {selectedMemory && (
              <div className="mb-6 p-4 rounded-lg" style={{
                background: 'var(--darker-bg)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--gray-med)' }}>
                  Selected: {selectedMemory.title}
                </h3>
                <div className="text-sm space-y-1" style={{ color: 'var(--gray-light)' }}>
                  <div>Size: {selectedMemory.content.length.toLocaleString()} characters ({(selectedMemory.content.length / 1000).toFixed(1)}KB)</div>
                  <div>Estimated sections: {Math.ceil(selectedMemory.content.length / 10000)}</div>
                </div>
              </div>
            )}

            {/* Split Button */}
            <button
              onClick={splitMemory}
              disabled={!selectedMemory || splitting}
              className="w-full py-3 px-4 rounded-lg font-medium transition-all mb-6"
              style={{
                background: splitting ? 'rgba(114, 212, 204, 0.5)' : 'var(--teal-bright)',
                color: '#1f1f1f',
                cursor: !selectedMemory || splitting ? 'not-allowed' : 'pointer',
                opacity: !selectedMemory || splitting ? 0.5 : 1
              }}
            >
              {splitting ? 'Splitting...' : 'Split Memory'}
            </button>

            {/* Result */}
            {result && (
              <div className="p-4 rounded-lg font-mono text-sm whitespace-pre-wrap" style={{
                background: 'var(--darker-bg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--gray-med)'
              }}>
                {result}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
