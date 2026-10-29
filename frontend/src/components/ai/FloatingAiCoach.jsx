import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { aiService } from '../../services/ai.service';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  Maximize2,
  ChevronRight,
  Zap,
  Cpu,
} from 'lucide-react';

export default function FloatingAiCoach() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'quick_welcome',
      role: 'assistant',
      content: 'Hi! I am **Habytat Synapse**. Ask me anything about your workout splits, macros, protein goals, or habit streaks!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // If already on /synapse or /coach, hide the floating button to prevent clutter
  if (location.pathname === '/synapse' || location.pathname === '/coach' || location.pathname === '/ai-agent') {
    return null;
  }

  // Route-aware contextual suggestions
  let contextualPrompt = 'Ask Habytat AI...';
  let quickSuggestions = [
    'How to reach 120g protein on a veg diet?',
    'How to stop breaking habit streaks?',
    'Best 4-day workout split for fat loss?',
  ];

  if (location.pathname === '/nutrition') {
    contextualPrompt = 'Ask about meals, macros, or calories...';
    quickSuggestions = [
      'Analyze my nutrition progress for today',
      'High-protein vegetarian dinner ideas',
      'How to stop sugar cravings after dinner?',
    ];
  } else if (location.pathname === '/workouts') {
    contextualPrompt = 'Ask about exercises, splits, or recovery...';
    quickSuggestions = [
      'Should I do cardio before or after weights?',
      'How to recover from severe muscle soreness?',
      'Ideal rest intervals between heavy sets',
    ];
  } else if (location.pathname === '/habits') {
    contextualPrompt = 'Ask about habit stacking or consistency...';
    quickSuggestions = [
      'How does the 2-minute rule work in practice?',
      'How to bounce back after missing a streak?',
      'Tips to stop procrastinating on difficult tasks',
    ];
  }

  const handleSend = async (text = inputMessage) => {
    const prompt = (text || '').trim();
    if (!prompt || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiService.sendMessage({
        message: prompt,
        category: 'all',
        history,
      });

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        followUps: res.followUps,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I ran into an issue answering that. Please try again or open the full AI Coach page.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper for inline styles (**bold**, *italic*, `code`)
  const renderInlineStyles = (str) => {
    if (!str) return '';
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-[#F5F7FC]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-[#A4AABC]">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-black/50 text-[#C8FF00] font-mono text-[10px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Formatted markdown renderer with support for tables, headers, lists & blockquotes
  const renderFormattedMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Markdown Table Support
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const rawHeader = tableLines[0];
          const headerCells = rawHeader
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);

          const rowLines = tableLines.slice(2);
          const rows = rowLines.map((r) =>
            r
              .split('|')
              .map((c) => c.trim())
              .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
          );

          elements.push(
            <div key={`tbl_${i}`} className="overflow-x-auto my-2 rounded-xl border border-[#242A3A] bg-[#0A0D17]">
              <table className="w-full text-left text-[10px] border-collapse min-w-[240px]">
                <thead>
                  <tr className="bg-[#151A29] text-[#C8FF00] border-b border-[#242A3A]">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="py-1.5 px-2 font-black uppercase tracking-wider">
                        {renderInlineStyles(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242A3A]/50">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#111522]/60'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-2 text-[#F5F7FC] leading-tight">
                          {renderInlineStyles(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 2. Section Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={i} className="text-xs font-black mt-2 mb-1 text-[#C8FF00]">
            {line.replace('### ', '')}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h5 key={i} className="text-[11px] font-bold mt-1.5 mb-0.5 text-[#39E58C]">
            {line.replace('#### ', '')}
          </h5>
        );
        i++;
        continue;
      }

      // 3. Actionable Takeaways & Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <div
            key={i}
            className="border-l-2 border-[#C8FF00] bg-[#151A29]/90 text-[#F5F7FC] pl-2.5 py-1.5 my-2 rounded-r-lg text-[10px] font-medium"
          >
            {renderInlineStyles(line.replace('> ', ''))}
          </div>
        );
        i++;
        continue;
      }

      // 4. Bullet lists
      if (line.startsWith('* ') || line.startsWith('- ')) {
        elements.push(
          <li key={i} className="ml-3 list-disc text-[11px] my-0.5 leading-snug">
            {renderInlineStyles(line.replace(/^(\*|-)\s+/, ''))}
          </li>
        );
        i++;
        continue;
      }

      // 5. Numbered lists
      if (/^\d+\.\s+/.test(line)) {
        elements.push(
          <div key={i} className="ml-1 text-[11px] my-0.5 leading-snug">
            {renderInlineStyles(line)}
          </div>
        );
        i++;
        continue;
      }

      // 6. Spacing
      if (!line.trim()) {
        elements.push(<div key={i} className="h-1" />);
        i++;
        continue;
      }

      // 7. Regular paragraph
      elements.push(
        <p key={i} className="text-[11px] my-0.5 leading-relaxed">
          {renderInlineStyles(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isOpen, loading]);

  return (
    <>
      {/* Floating Trigger Orb (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-5 z-40 animate-bounce-subtle">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#C8FF00] via-[#8B5CF6] to-[#39E58C] text-[#080A12] font-black text-xs shadow-2xl shadow-[#C8FF00]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
            title="Ask Habytat AI Agent"
          >
            <div className="w-6 h-6 rounded-full bg-[#080A12] text-[#C8FF00] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold tracking-tight">Ask Synapse</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
            </span>
          </button>
        </div>
      )}

      {/* Floating Drawer / Slide-Over Window */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 sm:right-5 sm:bottom-5 sm:top-auto sm:h-[580px] w-full sm:w-[380px] z-50 flex flex-col rounded-t-[28px] sm:rounded-[28px] shadow-2xl border transition-all animate-slide-up backdrop-blur-xl overflow-hidden bg-[#0D101B]/95 border-[#242A3A] text-[#F5F7FC]">
          {/* Header */}
          <div className="p-3.5 border-b border-[#242A3A] flex items-center justify-between bg-[#111522]/90">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#C8FF00]/15 text-[#C8FF00] flex items-center justify-center border border-[#C8FF00]/30 shadow-[0_0_10px_rgba(200,255,0,0.2)]">
                <Cpu className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#F5F7FC] flex items-center gap-1.5">
                  <span>Habytat Synapse</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39E58C] shadow-[0_0_6px_#39E58C]" />
                </h3>
                <p className="text-[10px] text-[#A4AABC]">Neural Health & Biomechanics</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/synapse"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#A4AABC] hover:text-[#C8FF00] hover:bg-[#151A29] transition-colors"
                title="Open Full Synapse Workstation"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isAssistant ? 'items-start' : 'items-start justify-end flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] ${
                      isAssistant ? 'bg-[#C8FF00]/20 text-[#C8FF00]' : 'bg-[#151A29] text-slate-300'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      isAssistant
                        ? 'bg-[#111522] border border-[#242A3A] text-[#F5F7FC]'
                        : 'bg-[#C8FF00] text-[#080A12] font-semibold'
                    }`}
                  >
                    {isAssistant ? (
                      renderFormattedMarkdown(m.content)
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}

                    {isAssistant && m.followUps && (
                      <div className="mt-2 pt-2 border-t border-[#242A3A]/40 flex flex-wrap gap-1">
                        {m.followUps.slice(0, 2).map((fu, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(fu)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-[#151A29] text-[#C8FF00] border border-[#242A3A] hover:bg-[#1D2332] text-left"
                          >
                            + {fu}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#111522] border border-[#242A3A] text-[11px] text-[#A4AABC]">
                <Bot className="w-3.5 h-3.5 animate-spin text-[#C8FF00]" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="p-2 border-t border-[#242A3A]/60 bg-[#111522]/40 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickSuggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#151A29] hover:bg-[#1D2332] text-[#A4AABC] hover:text-[#C8FF00] border border-[#242A3A] shrink-0 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-2.5 border-t border-[#242A3A] bg-[#0D101B]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder={contextualPrompt}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 rounded-xl px-3 py-2 text-xs bg-[#151A29] border border-[#242A3A] text-[#F5F7FC] placeholder-[#70788D] focus:outline-none focus:border-[#C8FF00]"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
