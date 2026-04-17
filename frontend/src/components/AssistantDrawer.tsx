'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from './AssistantContext';
import { Sparkles, X, RotateCcw } from 'lucide-react';

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
                <Sparkles className="h-4 w-4 text-emerald-400" strokeWidth={1.4} />
                <h2 className="text-sm font-bold tracking-tight text-foreground">Assistant</h2>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleNewConversation}
                    className="rounded px-2 py-1 text-xs text-muted hover:text-foreground transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  aria-label="Close assistant drawer"
                  className="rounded p-1 text-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div className="flex flex-1 flex-col items-center justify-center text-center opacity-40">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="h-6 w-6" strokeWidth={1.2} />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    How can I help with your research?
                  </p>
                  <p className="mt-1 text-xs text-muted max-w-[240px]">
                    I have context on the current target, pockets, and ligands.
                  </p>
                </div>

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

              <div className="border-t border-border px-4 py-4">
                <div className="mb-3 text-mono-label">Suggested Queries</div>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      disabled={streaming}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-[11px] font-medium text-muted hover:text-foreground hover:border-border-hover transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

            <div className="border-t border-border p-4 bg-surface/30">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask a question..."
                  disabled={streaming}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="brand-gradient group flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-black active:scale-[0.97] transition-all disabled:opacity-40"
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
