'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from './AssistantContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const PRESET_CHIPS: Record<string, string[]> = {
  target: [
    'Is this target druggable?',
    'Compare the top 3 pockets',
    'What diseases is this target associated with?',
    'Summarize the druggability assessment',
  ],
  pocket_detail: [
    'Is this pocket druggable?',
    'What makes the best ligand effective?',
    'Suggest modifications to improve binding',
    'Describe the pocket chemistry',
  ],
  report: [
    'Explain the druggability verdict',
    'What are the key risk factors?',
    'Compare this to typical drug targets',
  ],
  home: [
    'How does drug target discovery work?',
    'What is pocket druggability?',
    'Explain Lipinski\'s rule of five',
  ],
};

function getChips(page: string): string[] {
  return PRESET_CHIPS[page] || PRESET_CHIPS.home;
}

export default function AssistantDrawer() {
  const { context, drawerOpen, closeDrawer } = useAssistant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [drawerOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreaming(true);

    // Build history for API (exclude current message)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(`${API_BASE}/api/v1/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context,
          history,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: 'Request failed' }));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Sorry, I couldn't process that request. ${err.detail || ''}`,
        }]);
        setStreaming(false);
        return;
      }

      // Parse SSE stream
      const reader = resp.body?.getReader();
      if (!reader) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No response received.' }]);
        setStreaming(false);
        return;
      }

      let assistantText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              assistantText += parsed.delta.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
            if (parsed.type === 'error') {
              assistantText += '\n\n*Error: Could not complete response.*';
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      // If no text was streamed, show fallback
      if (!assistantText) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'I received your question but couldn\'t generate a response. Please check that the Claude API key is configured.',
          };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check the backend is running.',
      }]);
    } finally {
      setStreaming(false);
    }
  }, [context, messages, streaming]);

  function handleNewConversation() {
    setMessages([]);
    setInput('');
  }

  const chips = getChips(context.page);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">&#10024;</span>
                <h2 className="font-semibold text-foreground">Drug Design Assistant</h2>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleNewConversation}
                    className="rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    New chat
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  aria-label="Close assistant drawer"
                  className="rounded p-1 text-muted hover:text-foreground transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-4xl mb-3">&#129302;</span>
                  <p className="text-sm text-muted mb-1">
                    Ask me about drug design, pocket analysis, or ligand optimization.
                  </p>
                  <p className="text-xs text-muted">
                    I have context about the current page data.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-900/30 text-foreground'
                        : 'bg-surface text-foreground border border-border'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div
                        className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-emerald-400 [&_code]:text-amber-400 [&_code]:bg-surface-alt [&_code]:px-1 [&_code]:rounded"
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                      />
                    ) : (
                      msg.content
                    )}
                    {msg.role === 'assistant' && !msg.content && streaming && (
                      <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Preset chips */}
            {messages.length === 0 && (
              <div className="border-t border-border px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      disabled={streaming}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-foreground hover:border-border-hover transition-colors disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask about this target..."
                  disabled={streaming}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  aria-label="Send message"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Minimal markdown to HTML (bold, italic, code, lists, paragraphs) */
function formatMarkdown(text: string): string {
  if (!text) return '';
  return text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Unordered list items
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Line breaks → paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '');
}
