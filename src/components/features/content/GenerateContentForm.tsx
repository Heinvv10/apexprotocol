"use client";

import { useState } from 'react';
import { z } from 'zod';
import { generateContentSchema } from '@/lib/validations/content';
import { StreamEvent } from '@/lib/ai/streaming';

type ContentType = 'blog_post' | 'faq' | 'press_release';
type AIProvider = 'claude' | 'chatgpt';

interface StreamingContentEvent {
  type: string;
  data: any;
  timestamp: number;
}

export default function GenerateContentForm() {
  const [contentType, setContentType] = useState<ContentType>('blog_post');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [brandVoice, setBrandVoice] = useState('professional');
  const [aiProvider, setAIProvider] = useState<AIProvider>('claude');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingEvents, setStreamingEvents] = useState<StreamingContentEvent[]>([]);
  const [tokens, setTokens] = useState({ input: 0, output: 0, total: 0 });
  const [error, setError] = useState('');
  const [streamController, setStreamController] = useState<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent, useStreaming = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStreamingEvents([]);
    setGeneratedContent('');
    setTokens({ input: 0, output: 0, total: 0 });

    // Create a new abort controller for cancellation
    const controller = new AbortController();
    setStreamController(controller);

    try {
      // Validate input using Zod schema
      const validationResult = generateContentSchema.safeParse({
        contentType,
        keywords,
        brandVoice,
        aiProvider,
        streaming: useStreaming
      });

      if (!validationResult.success) {
        setError(validationResult.error.issues[0].message);
        setLoading(false);
        return;
      }

      // Use single endpoint with streaming parameter
      const endpoint = '/api/generate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          keywords,
          brandVoice,
          aiProvider,
          streaming: useStreaming
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate content');
        setLoading(false);
        return;
      }

      if (useStreaming) {
        // Handle Server-Sent Events stream
        const reader = response.body?.getReader();
        const textDecoder = new TextDecoder();

        let fullContent = '';

        while (true) {
          const { done, value } = await reader?.read() || {};

          if (done) break;

          const chunk = textDecoder.decode(value);
          const lines = chunk.split('\n');

          lines.forEach(line => {
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));

                // Process different event types
                switch (event.type) {
                  case 'token':
                    fullContent += event.data;
                    setGeneratedContent(fullContent);
                    break;
                  case 'usage':
                    if (typeof event.data === 'object' && event.data !== null && 'input' in event.data) {
                      setTokens(event.data as { input: number; output: number; total: number });
                    }
                    break;
                  case 'error':
                    if (typeof event.data === 'object' && event.data !== null && 'message' in event.data) {
                      setError((event.data as any).message || 'Stream error');
                    }
                    break;
                }

                setStreamingEvents(prev => [...prev, event]);
              } catch (parseError) {
                console.warn('Failed to parse event:', parseError);
              }
            }
          });
        }
      } else {
        // Non-streaming mode (existing logic)
        const { content } = await response.json();
        setGeneratedContent(content);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Content generation cancelled');
      } else {
        setError('An unexpected error occurred');
        console.error(err);
      }
    } finally {
      setLoading(false);
      setStreamController(null);
    }
  };

  const cancelGeneration = () => {
    if (streamController) {
      streamController.abort();
    }
  };

  const handleKeywordAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newKeyword = e.currentTarget.value.trim();
      if (!keywords.includes(newKeyword) && keywords.length < 10) {
        setKeywords([...keywords, newKeyword]);
        e.currentTarget.value = '';
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
      {/* Content Type Selection */}
      <div className="card-secondary">
        <label htmlFor="contentType" className="block text-sm font-medium text-foreground mb-2">
          Content Type
        </label>
        <select
          id="contentType"
          value={contentType}
          onChange={(e) => setContentType(e.target.value as ContentType)}
          className="w-full rounded-lg border border-white/10 bg-[#101828] text-foreground px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="blog_post">Blog Post</option>
          <option value="faq">FAQ</option>
          <option value="press_release">Press Release</option>
        </select>
      </div>

      {/* Keywords Input */}
      <div className="card-secondary">
        <label htmlFor="keywords" className="block text-sm font-medium text-foreground mb-2">
          Keywords (Press Enter to add, max 10)
        </label>
        <div className="flex flex-wrap gap-2">
          {keywords.map(keyword => (
            <span
              key={keyword}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30"
            >
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="ml-2 hover:text-error transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            onKeyDown={handleKeywordAdd}
            placeholder="Type and press Enter"
            className="flex-grow rounded-lg border border-white/10 bg-[#101828] text-foreground px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Brand Voice */}
      <div className="card-secondary">
        <label htmlFor="brandVoice" className="block text-sm font-medium text-foreground mb-2">
          Brand Voice
        </label>
        <select
          id="brandVoice"
          value={brandVoice}
          onChange={(e) => setBrandVoice(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#101828] text-foreground px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="friendly">Friendly</option>
          <option value="authoritative">Authoritative</option>
          <option value="playful">Playful</option>
        </select>
      </div>

      {/* AI Provider Selection */}
      <div className="card-secondary">
        <label htmlFor="aiProvider" className="block text-sm font-medium text-foreground mb-2">
          AI Provider
        </label>
        <select
          id="aiProvider"
          value={aiProvider}
          onChange={(e) => setAIProvider(e.target.value as AIProvider)}
          className="w-full rounded-lg border border-white/10 bg-[#101828] text-foreground px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="claude">Claude (Anthropic)</option>
          <option value="chatgpt">ChatGPT (OpenAI)</option>
        </select>
      </div>

      {/* Submit Buttons */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-grow bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? 'Generating...' : 'Generate Content (Streaming)'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e as any, false)}
          disabled={loading}
          className="flex-grow bg-secondary text-secondary-foreground py-3 px-6 rounded-xl font-medium hover:bg-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Content (Non-Streaming)
        </button>
      </div>

      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full animate-pulse"
            style={{ width: '50%' }}
          ></div>
        </div>
      )}

      {loading && (
        <button
          type="button"
          onClick={cancelGeneration}
          className="w-full bg-error text-white py-2 px-4 rounded-lg hover:bg-error/90 transition-all"
        >
          Cancel Generation
        </button>
      )}

      {/* Error Handling */}
      {error && (
        <div className="card-secondary border-error/30 bg-error/5">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Token Usage Display */}
      {tokens.total > 0 && (
        <div className="card-secondary bg-primary/5 border-primary/20 space-y-2">
          <h4 className="text-sm font-medium text-foreground">Token Usage</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-semibold">Input Tokens:</span> {tokens.input}
            </div>
            <div>
              <span className="font-semibold">Output Tokens:</span> {tokens.output}
            </div>
            <div>
              <span className="font-semibold">Total Tokens:</span> {tokens.total}
            </div>
          </div>
        </div>
      )}

      {/* Generated Content Display */}
      {generatedContent && (
        <div className="card-primary space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Generated Content:</h3>
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-secondary-foreground leading-relaxed bg-background p-4 rounded-lg border border-white/5">
              {generatedContent}
            </pre>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(generatedContent)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success border border-success/30 font-medium hover:bg-success/20 transition-all"
            >
              Copy
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 font-medium hover:bg-primary/20 transition-all"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Optional: Advanced Streaming Events Log */}
      {streamingEvents.length > 0 && (
        <div className="card-secondary bg-[#101828] text-xs overflow-auto max-h-40">
          <h4 className="text-sm font-medium text-foreground mb-2">Stream Events Log:</h4>
          <pre>{JSON.stringify(streamingEvents, null, 2)}</pre>
        </div>
      )}
    </form>
  );
}