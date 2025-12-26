"use client";

import { useState } from 'react';
import { z } from 'zod';
import { generateContentSchema } from '@/lib/validations/content';

import { contentTypeEnum, aiPlatformEnum } from '@/lib/validations/content';

type ContentType = 'blog_post' | 'faq' | 'press_release';
type AIProvider = 'claude' | 'chatgpt';

export default function GenerateContentForm() {
  const [contentType, setContentType] = useState<ContentType>('blog_post');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [brandVoice, setBrandVoice] = useState('professional');
  const [aiProvider, setAIProvider] = useState<AIProvider>('claude');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate input using Zod schema
      const validationResult = generateContentSchema.safeParse({
        contentType,
        keywords,
        brandVoice,
        aiProvider
      });

      if (!validationResult.success) {
        setError(validationResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Call API endpoint for content generation
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          keywords,
          brandVoice,
          aiProvider
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate content');
        setLoading(false);
        return;
      }

      const { content } = await response.json();
      setGeneratedContent(content);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(0,229,204,0.3)] hover:shadow-[0_0_35px_rgba(0,229,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {loading ? 'Generating...' : 'Generate Content'}
      </button>

      {/* Error Handling */}
      {error && (
        <div className="card-secondary border-error/30 bg-error/5">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Generated Content Display */}
      {generatedContent && (
        <div className="card-primary space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Generated Content:</h3>
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-secondary-foreground leading-relaxed bg-[#0a0f1a] p-4 rounded-lg border border-white/5">{generatedContent}</pre>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(generatedContent)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success border border-success/30 font-medium hover:bg-success/20 transition-all"
          >
            Copy
          </button>
        </div>
      )}
    </form>
  );
}