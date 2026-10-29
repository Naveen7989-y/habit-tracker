import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { aiService } from '../services/ai.service';
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Target,
  Flame,
  Dumbbell,
  Droplets,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Key,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Activity,
  Cpu,
  Layers,
  Download,
  RefreshCw,
  Compass,
  Sliders,
  CornerDownLeft,
} from 'lucide-react';

/**
 * 4 Specialised Neural Personas for Synapse
 */
const SYNAPSE_PERSONAS = [
  {
    id: 'all',
    name: 'Holistic Synapse',
    tag: 'Full Spectrum',
    desc: 'Integrated habits, nutrition & biomechanics',
    icon: Sparkles,
    accentColor: '#C8FF00',
    promptPrefix: 'As Holistic Synapse, synthesize habits, nutrition, and training into a balanced protocol: ',
  },
  {
    id: 'nutrition',
    name: 'Macro Architect',
    tag: 'Nutrition & Diet',
    desc: 'Precision TDEE, protein grams, timings & food swaps',
    icon: Flame,
    accentColor: '#FFBF47',
    promptPrefix: 'As Macro Architect, calculate exact macros, protein densities, and meal schedules for: ',
  },
  {
    id: 'fitness',
    name: 'Split Programmer',
    tag: 'Biomechanics & Gym',
    desc: 'Progressive overload, exercise sequences & recovery',
    icon: Dumbbell,
    accentColor: '#39E58C',
    promptPrefix: 'As Split Programmer, design progressive overload routines and exercise sequences for: ',
  },
  {
    id: 'habits',
    name: 'Neuroplastician',
    tag: 'Habit Science',
    desc: 'Atomic cues, streak preservation & dopamine loops',
    icon: Target,
    accentColor: '#8B5CF6',
    promptPrefix: 'As Behavioral Neuroplastician, apply atomic habits and streak protection psychology to: ',
  },
];

/**
 * Curated Prompt Launch Matrix
 */
const SYNAPSE_PROMPTS = [
  {
    category: 'nutrition',
    title: '120g Indian Veg Protein Protocol',
    subtitle: 'Sorted by highest protein yield per 100g with daily timing',
    text: 'How can I reach 120g of protein on an Indian vegetarian diet without excessive calories?',
    icon: '🥗',
    badge: 'High-Protein',
  },
  {
    category: 'fitness',
    title: '4-Day Lean Muscle Hypertrophy Split',
    subtitle: 'Compound lifts, accessory rep ranges, and rest intervals',
    text: 'What is the best 4-day workout split for building lean muscle while shedding body fat?',
    icon: '🏋️',
    badge: 'Hypertrophy',
  },
  {
    category: 'habits',
    title: 'Atomic Streak Defense & Recovery',
    subtitle: 'The 2-minute rule and bouncing back after a missed day',
    text: 'I broke my 10-day habit streak yesterday. What is the science-backed protocol to bounce back immediately without guilt?',
    icon: '⚡',
    badge: 'Mindset',
  },
  {
    category: 'nutrition',
    title: 'Post-Dinner Sugar Craving Shield',
    subtitle: 'Mitigating evening dopamine drops and blood sugar spikes',
    text: 'Why do I crave sweet foods after dinner, and what is a practical habit replacement to stop it?',
    icon: '🌙',
    badge: 'Cravings',
  },
  {
    category: 'fitness',
    title: 'Cardio vs Weightlifting Sequencing',
    subtitle: 'Glycogen depletion and optimal fat oxidation hierarchy',
    text: 'Should I do cardio before or after lifting weights for optimal muscle preservation and fat loss?',
    icon: '🏃',
    badge: 'Biomechanics',
  },
  {
    category: 'habits',
    title: 'Habit Stacking with Anchor Routines',
    subtitle: 'Pairing new discipline with established automatic actions',
    text: 'How do I use habit stacking and anchor cues to guarantee I drink 3L of water every single day?',
    icon: '🧠',
    badge: 'Behavioral',
  },
];

export default function AiCoach() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [activePersona, setActivePersona] = useState('all');
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'telemetry'
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`habytat_synapse_chat_${user?.id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'synapse_init',
        role: 'assistant',
        category: 'holistic',
        content: `### ⚡ Habytat Synapse Neural Core Online

Greetings, **${user?.name ? user.name.split(' ')[0] : 'Athlete'}**. I am **Habytat Synapse**, your dedicated Neural Health, Nutrition & Biomechanics Intelligence engine.

I synthesize clinical exercise science, metabolic nutrition, and behavioral neuroplasticity into structured, sorted action plans:

* 🥗 **Nutritional Architecture**: Precision protein yields, meal schedules, and craving mitigation.
* 🏋️ **Biomechanics & Splits**: Progressive overload protocols, compound hierarchies, and rest timing.
* 🧠 **Habit Psychology**: Atomic stacking, streak protection, and eliminating resistance.
* 📊 **Live Telemetry Diagnostic**: Click **"Run Telemetry Audit"** anytime to review your logged habits, calories, and workouts today.

> **Scope Protection Active**: I am strictly dedicated to your health, nutrition, habits, and fitness. Ask me a question or select a protocol below.`,
        followUps: [
          'Run a live diagnostic on my logged habits & calories today',
          'What is the best 4-day workout split for fat loss?',
          'How can I get 120g protein on an Indian vegetarian diet?',
          'How to stop procrastinating on my daily habits?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(
    () => localStorage.getItem('habytat_custom_ai_key') || import.meta.env.VITE_GROQ_API_KEY || ''
  );
  const [tempApiKey, setTempApiKey] = useState(customApiKey);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const isInitialMount = useRef(true);

  // Ensure window always starts at top when loading or reviewing this page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Sync session to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`habytat_synapse_chat_${user?.id || 'guest'}`, JSON.stringify(messages));
    } catch {}
  }, [messages, user?.id]);

  // Fetch real-time health context
  useEffect(() => {
    aiService
      .getUserContext()
      .then((data) => {
        if (data) setUserContext(data);
      })
      .catch((err) => console.warn('Synapse: telemetry sync error:', err));
  }, []);

  // Auto-scroll ONLY the chat container when user sends or receives messages (never on initial mount or affecting window scroll)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  // Adjust textarea height automatically
  const handleTextareaInput = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSendMessage = async (textToSend = inputMessage, overrideCategory = activePersona) => {
    const prompt = (textToSend || '').trim();
    if (!prompt || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      category: overrideCategory,
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiService.sendMessage({
        message: prompt,
        category: overrideCategory,
        history,
        customApiKey: customApiKey || undefined,
      });

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        category: res.category || overrideCategory,
        content: res.reply,
        followUps: res.followUps || [],
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Synapse AI Error:', err);
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        category: 'error',
        content: `⚠️ **Synapse Link Interrupted**: ${err.message || 'Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Protocol copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportBriefing = () => {
    const textContent = messages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'YOU' : 'HABYTAT SYNAPSE'}:\n${m.content}\n\n`)
      .join('---\n');
    navigator.clipboard.writeText(textContent);
    showToast('Full Synapse session copied to clipboard');
  };

  const handleClearSession = () => {
    if (!window.confirm('Reset Synapse session and initialize a clean thread?')) return;
    const initialWelcome = [
      {
        id: 'synapse_init',
        role: 'assistant',
        category: 'holistic',
        content: `### ⚡ Synapse Neural Thread Initialized

Neural slate cleared. Ready for your next query on **Habits**, **Nutrition**, or **Biomechanics**.`,
        followUps: [
          'Run a live diagnostic on my logged habits & calories today',
          'What is the best 4-day workout split for fat loss?',
          'How can I get 120g protein on an Indian vegetarian diet?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(initialWelcome);
    localStorage.removeItem(`habytat_synapse_chat_${user?.id || 'guest'}`);
    showToast('New thread ready');
  };

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setCustomApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('habytat_custom_ai_key', trimmed);
    } else {
      localStorage.removeItem('habytat_custom_ai_key');
    }
    setApiKeyModalOpen(false);
    showToast('Neural engine credentials updated');
  };

  // Helper for inline styling (**bold**, *italic*, `code`)
  const renderInlineStyles = (str) => {
    if (!str) return '';
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-black ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className={`italic ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-black/60 text-[#C8FF00] font-mono text-[11px] border border-[#242A3A]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Markdown parser with rich table rendering and callout highlights
  const renderFormattedMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Markdown Table Parser
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
            <div
              key={`tbl_${i}`}
              className={`overflow-x-auto my-3 rounded-2xl border shadow-xl ${
                isDark ? 'bg-[#07090F] border-[#242A3A]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isDark
                        ? 'bg-[#151A29] text-[#C8FF00] border-[#242A3A]'
                        : 'bg-slate-200 text-slate-900 border-slate-300'
                    }`}
                  >
                    {headerCells.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        scope="col"
                        className="py-2.5 px-3 font-black uppercase tracking-wider text-[11px]"
                      >
                        {renderInlineStyles(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={isDark ? 'divide-y divide-[#242A3A]/40' : 'divide-y divide-slate-200'}>
                  {rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 0
                          ? 'bg-transparent'
                          : isDark
                          ? 'bg-[#111522]/50 hover:bg-[#151A29]/70'
                          : 'bg-white hover:bg-slate-100'
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 leading-relaxed text-xs ${
                            isDark ? 'text-[#F5F7FC]' : 'text-slate-800'
                          }`}
                        >
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
          <h3
            key={i}
            className="text-base sm:text-lg font-black mt-3 mb-1 text-[#C8FF00] flex items-center gap-2 tracking-tight"
          >
            <span>{line.replace('### ', '')}</span>
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={i} className="text-sm font-extrabold mt-2.5 mb-1 text-[#39E58C]">
            {line.replace('#### ', '')}
          </h4>
        );
        i++;
        continue;
      }

      // 3. Actionable Takeaways & Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <div
            key={i}
            className={`border-l-4 pl-3.5 py-2.5 my-2.5 rounded-r-2xl font-medium text-xs sm:text-sm shadow-md ${
              isDark
                ? 'border-[#C8FF00] bg-gradient-to-r from-[#151A29] to-[#0D101B] text-[#F5F7FC]'
                : 'border-emerald-500 bg-emerald-50/80 text-emerald-950'
            }`}
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
          <li key={i} className="ml-4 list-disc text-xs sm:text-sm my-0.5 leading-relaxed">
            {renderInlineStyles(line.replace(/^(\*|-)\s+/, ''))}
          </li>
        );
        i++;
        continue;
      }

      // 5. Numbered lists
      if (/^\d+\.\s+/.test(line)) {
        elements.push(
          <div key={i} className="ml-2 text-xs sm:text-sm my-1 leading-relaxed">
            {renderInlineStyles(line)}
          </div>
        );
        i++;
        continue;
      }

      // 6. Spacing
      if (!line.trim()) {
        elements.push(<div key={i} className="h-1.5" />);
        i++;
        continue;
      }

      // 7. Regular paragraph
      elements.push(
        <p key={i} className="text-xs sm:text-sm my-1 leading-relaxed">
          {renderInlineStyles(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  const selectedPersonaData = SYNAPSE_PERSONAS.find((p) => p.id === activePersona) || SYNAPSE_PERSONAS[0];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full pt-2 sm:pt-4 pb-8 space-y-4 animate-fade-in px-2 sm:px-4 lg:px-6">
        {/* ================================================= */}
        {/* EXECUTIVE COMMAND HEADER                          */}
        {/* ================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl border backdrop-blur-xl bg-gradient-to-r from-[#0D101B]/95 via-[#111522]/90 to-[#0D101B]/95 border-[#242A3A] shadow-2xl">
          <div className="flex items-center gap-3.5">
            {/* Animated Synapse Neural Emblem */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#080A12] to-[#151A29] border border-[#C8FF00]/40 flex items-center justify-center shadow-[0_0_25px_rgba(200,255,0,0.25)] shrink-0 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#C8FF00]/20 via-[#8B5CF6]/20 to-[#00F0FF]/20 animate-pulse" />
              <div className="relative z-10 text-[#C8FF00]">
                <Cpu className="w-6 h-6 animate-spin-slow" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#39E58C] rounded-full border-2 border-[#080A12]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F7FC] flex items-center gap-2">
                  <span>Habytat Synapse</span>
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39E58C] animate-ping" />
                  <span>GROQ 120B • NEURAL ACTIVE</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#A4AABC]">
                Autonomous Intelligence for Habits, Nutrition & Biomechanics.
              </p>
            </div>
          </div>

          {/* Top Actions Ribbon */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleSendMessage(
                  'Run an immediate neural audit on my logged habits, calories, water, and workouts for today and provide real-time adjustments.',
                  'all'
                )
              }
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#99E300] hover:brightness-110 text-[#080A12] text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(200,255,0,0.3)] transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-[#080A12]" />
              <span>Run Telemetry Audit</span>
            </button>

            <button
              onClick={handleExportBriefing}
              className="p-2 rounded-xl bg-[#151A29] hover:bg-[#1D2332] text-[#A4AABC] hover:text-[#F5F7FC] border border-[#242A3A] transition-all cursor-pointer"
              title="Copy Entire Session Protocol"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setApiKeyModalOpen(true)}
              className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                customApiKey
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  : 'bg-[#151A29] border-[#242A3A] text-[#A4AABC] hover:text-[#F5F7FC]'
              }`}
              title="Neural Engine Credentials (Groq / Gemini)"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearSession}
              className="p-2 rounded-xl bg-[#151A29] hover:bg-[#1D2332] text-[#A4AABC] hover:text-rose-400 border border-[#242A3A] transition-all cursor-pointer"
              title="Initialize New Neural Thread"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* TOAST FEEDBACK NOTIFICATION                       */}
        {/* ================================================= */}
        {toastMessage && (
          <div className="fixed top-24 right-6 z-50 animate-slide-down">
            <div className="px-4 py-2.5 rounded-2xl bg-[#0D101B] border border-[#C8FF00]/50 text-[#C8FF00] text-xs font-bold shadow-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#39E58C]" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Mobile Viewport Segment Switcher (320px to 1024px) */}
        <div className="flex lg:hidden items-center p-1 rounded-2xl bg-[#111522] border border-[#242A3A] text-xs font-bold w-full shadow-lg">
          <button
            type="button"
            onClick={() => setMobileTab('chat')}
            aria-label="Switch to Synapse Conversation Terminal"
            className={`flex-1 py-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00] ${
              mobileTab === 'chat'
                ? 'bg-[#C8FF00] text-[#080A12] font-black shadow-md'
                : 'text-[#A4AABC] hover:text-[#F5F7FC]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Synapse Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('telemetry')}
            aria-label="Switch to Personas and Telemetry Radar"
            className={`flex-1 py-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00] ${
              mobileTab === 'telemetry'
                ? 'bg-[#C8FF00] text-[#080A12] font-black shadow-md'
                : 'text-[#A4AABC] hover:text-[#F5F7FC]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Personas & Telemetry</span>
          </button>
        </div>

        {/* ================================================= */}
        {/* DUAL-PANE COMMAND CENTER WORKSTATION              */}
        {/* ================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ----------------------------------------------- */}
          {/* LEFT COLUMN: INTELLIGENCE & TELEMETRY RAIL (4)  */}
          {/* ----------------------------------------------- */}
          <div
            role="region"
            aria-label="Synapse Telemetry and Personas"
            className={`${
              mobileTab === 'telemetry' ? 'block' : 'hidden lg:block'
            } lg:col-span-4 space-y-4`}
          >
            {/* 1. NEURAL PERSONAS */}
            <div className="p-4 rounded-3xl border bg-[#0D101B]/95 border-[#242A3A] shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#242A3A]/60 pb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#A4AABC] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C8FF00]" />
                  <span>Synapse Neural Personas</span>
                </span>
                <span className="text-[10px] text-[#70788D]">1-Tap Switch</span>
              </div>

              <div className="space-y-1.5">
                {SYNAPSE_PERSONAS.map((persona) => {
                  const Icon = persona.icon;
                  const isActive = activePersona === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setActivePersona(persona.id)}
                      className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-[#151A29] border-[#C8FF00] shadow-[0_0_15px_rgba(200,255,0,0.15)]'
                          : 'bg-[#111522]/60 border-[#242A3A] hover:bg-[#151A29]/70 text-[#A4AABC] hover:text-[#F5F7FC]'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${persona.accentColor}18`,
                          borderColor: `${persona.accentColor}40`,
                          color: persona.accentColor,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-black truncate ${isActive ? 'text-[#F5F7FC]' : 'text-[#A4AABC]'}`}>
                            {persona.name}
                          </h4>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] shadow-[0_0_6px_#C8FF00]" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#70788D] truncate">{persona.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. REAL-TIME BIO-TELEMETRY RADAR */}
            {userContext && (
              <div className="p-4 rounded-3xl border bg-[#0D101B]/95 border-[#242A3A] shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#242A3A]/60 pb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#A4AABC] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#39E58C]" />
                    <span>Bio-Telemetry Radar</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#39E58C]/15 text-[#39E58C] font-bold">
                    Live
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Habits Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#A4AABC] flex items-center gap-1">
                        <Target className="w-3 h-3 text-purple-400" /> Habits Completed
                      </span>
                      <strong className="text-[#F5F7FC]">
                        {userContext.habits?.filter((h) => h.completedToday).length || 0} / {userContext.habits?.length || 0}
                      </strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-[#C8FF00] rounded-full transition-all"
                        style={{
                          width: `${
                            userContext.habits?.length
                              ? Math.round(
                                  ((userContext.habits?.filter((h) => h.completedToday).length || 0) /
                                    userContext.habits.length) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Calories Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#A4AABC] flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" /> Calories Consumed
                      </span>
                      <strong className="text-[#F5F7FC]">
                        {userContext.nutrition?.today?.totalCalories || 0} /{' '}
                        {userContext.nutrition?.goals?.dailyCalories || 2000} kcal
                      </strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((userContext.nutrition?.today?.totalCalories || 0) /
                                (userContext.nutrition?.goals?.dailyCalories || 2000)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Protein Badge */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#111522] border border-[#242A3A]">
                    <span className="text-[11px] text-[#A4AABC] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Protein Target
                    </span>
                    <span className="text-[11px] font-black text-emerald-400">
                      {userContext.nutrition?.today?.totalProtein || 0}g /{' '}
                      {userContext.nutrition?.goals?.proteinGrams || 120}g
                    </span>
                  </div>

                  {/* Hydration Badge */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#111522] border border-[#242A3A]">
                    <span className="text-[11px] text-[#A4AABC] flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Hydration
                    </span>
                    <span className="text-[11px] font-black text-cyan-400">
                      {userContext.nutrition?.today?.totalWaterMl || 0} ml
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. GUARDRAIL SCOPE PILL */}
            <div className="p-3.5 rounded-3xl border bg-[#0D101B]/80 border-[#242A3A] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[#C8FF00] font-black text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Scope Restriction Guaranteed</span>
              </div>
              <p className="text-[10px] text-[#70788D] leading-relaxed">
                Synapse exclusively assists with physical health, meals, fitness, habits, and Habytat tracking. General
                trivia, coding, and off-topic queries are strictly rejected.
              </p>
            </div>
          </div>

          {/* ----------------------------------------------- */}
          {/* RIGHT COLUMN: MAIN NEURAL TERMINAL (8)          */}
          {/* ----------------------------------------------- */}
          <div
            role="region"
            aria-label="Synapse AI Conversation Terminal"
            className={`${
              mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
            } lg:col-span-8 flex flex-col justify-between rounded-3xl border border-[#242A3A] bg-[#0D101B]/95 shadow-2xl overflow-hidden min-h-[620px] max-h-[780px]`}
          >
            {/* Terminal Status Bar */}
            <div className="p-3.5 px-5 border-b border-[#242A3A] bg-[#111522]/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#39E58C] shadow-[0_0_8px_#39E58C]" />
                <span className="font-extrabold text-[#F5F7FC]">Active Mode:</span>
                <span
                  className="font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider"
                  style={{
                    backgroundColor: `${selectedPersonaData.accentColor}20`,
                    color: selectedPersonaData.accentColor,
                  }}
                >
                  {selectedPersonaData.name}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#A4AABC]">
                <span className="hidden sm:inline">Inference Latency: ~480ms</span>
                <button
                  onClick={handleClearSession}
                  className="hover:text-rose-400 transition-colors p-1"
                  title="Clear thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Feed Scroll Container */}
            <div
              ref={chatContainerRef}
              role="log"
              aria-live="polite"
              aria-label="Synapse conversation stream"
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              {/* Quick Launch Cards (Shown when only 1 welcome message exists) */}
              {messages.length <= 1 && (
                <div className="space-y-3 mb-4 animate-fade-in">
                  <div className="flex items-center justify-between text-[11px] text-[#A4AABC]">
                    <span className="font-bold flex items-center gap-1.5 text-[#C8FF00]">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Curated Neural Protocols</span>
                    </span>
                    <span>1-Click Launch</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SYNAPSE_PROMPTS.filter(
                      (p) => activePersona === 'all' || p.category === activePersona
                    ).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt.text, prompt.category)}
                        className="p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer group hover:border-[#C8FF00]/50 hover:bg-[#151A29] bg-[#111522]/70 border-[#242A3A]"
                      >
                        <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                          {prompt.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h5 className="font-bold text-[#F5F7FC] text-xs truncate group-hover:text-[#C8FF00] transition-colors">
                              {prompt.title}
                            </h5>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#151A29] text-[#A4AABC] border border-[#242A3A] shrink-0 font-medium">
                              {prompt.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#70788D] line-clamp-1">{prompt.subtitle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Stream */}
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs sm:text-sm animate-fade-in ${
                      isAssistant ? 'items-start' : 'items-start justify-end flex-row-reverse'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        isAssistant
                          ? 'bg-gradient-to-tr from-[#C8FF00]/20 via-[#8B5CF6]/30 to-[#00F0FF]/20 border-[#C8FF00]/40 text-[#C8FF00]'
                          : 'bg-[#151A29] border-[#242A3A] text-slate-300'
                      }`}
                    >
                      {isAssistant ? <Cpu className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>

                    {/* Speech Bubble */}
                    <div
                      className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 shadow-lg space-y-2 ${
                        isAssistant
                          ? 'bg-[#111522] border border-[#242A3A] text-[#F5F7FC]'
                          : 'bg-gradient-to-r from-[#C8FF00] to-[#A3E600] text-[#080A12] font-semibold'
                      }`}
                    >
                      {/* Assistant Meta Header */}
                      {isAssistant && (
                        <div className="flex items-center justify-between border-b border-[#242A3A]/50 pb-2 text-[10px] text-[#A4AABC]">
                          <span className="font-extrabold uppercase tracking-wider text-[#C8FF00] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Habytat Synapse
                          </span>

                          <div className="flex items-center gap-2">
                            <span>{msg.timestamp}</span>
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="hover:text-[#F5F7FC] transition-colors p-1"
                              title="Copy advice"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-[#39E58C]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="break-words space-y-1">
                        {isAssistant ? renderFormattedMarkdown(msg.content) : msg.content}
                      </div>

                      {/* Follow-up Interactive Chips */}
                      {isAssistant && msg.followUps && msg.followUps.length > 0 && (
                        <div className="pt-2 border-t border-[#242A3A]/40 mt-3 space-y-1.5">
                          <p className="text-[10px] uppercase font-bold text-[#70788D]">Recommended Next Steps:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, fIdx) => (
                              <button
                                key={fIdx}
                                onClick={() => handleSendMessage(fu, msg.category)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all text-left border cursor-pointer bg-[#151A29] hover:bg-[#1D2332] text-[#C8FF00] border-[#242A3A] hover:border-[#C8FF00]/50"
                              >
                                + {fu}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Neural Synthesis Pulse Indicator */}
              {loading && (
                <div className="flex gap-3 text-xs sm:text-sm items-start animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/20 border border-[#C8FF00]/40 text-[#C8FF00] flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl p-4 border border-[#242A3A] bg-[#111522] text-[#A4AABC] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#39E58C] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs font-semibold ml-2">
                      Synapse synthesizing clinical & telemetry data...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Next-Gen Prompt Console */}
            <div className="p-3 border-t border-[#242A3A] bg-[#0D101B] space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative rounded-2xl border border-[#242A3A] bg-[#151A29]/80 focus-within:border-[#C8FF00] focus-within:shadow-[0_0_15px_rgba(200,255,0,0.15)] transition-all p-2 flex flex-col justify-between"
              >
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder={`Ask Synapse about habits, protein, workout splits, or type 'Analyze my day' (${selectedPersonaData.name} active)...`}
                  value={inputMessage}
                  onChange={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-transparent text-xs sm:text-sm text-[#F5F7FC] placeholder-[#70788D] focus:outline-none resize-none p-1.5"
                />

                <div className="flex items-center justify-between pt-1 border-t border-[#242A3A]/40 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#A4AABC]">
                    <span className="px-2 py-0.5 rounded-md bg-[#111522] border border-[#242A3A]">
                      Press <kbd className="text-[#C8FF00] font-mono font-bold">↵ Enter</kbd> to execute
                    </span>
                    <span className="hidden sm:inline text-[#70788D]">• Shift+Enter for new line</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      inputMessage.trim() && !loading
                        ? 'bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] shadow-md shadow-[#C8FF00]/30 active:scale-95'
                        : 'bg-[#111522] text-[#70788D] border border-[#242A3A] cursor-not-allowed'
                    }`}
                  >
                    <span>Transmit</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* SYNAPSE ENGINE CONFIGURATION MODAL                */}
        {/* ================================================= */}
        {apiKeyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 text-xs bg-[#0D101B] border-[#242A3A] text-[#F5F7FC]">
              <div className="flex items-center justify-between border-b border-[#242A3A]/60 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#C8FF00]" />
                  <h3 className="font-bold text-sm">Synapse Engine Configuration</h3>
                </div>
                <button
                  onClick={() => setApiKeyModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-700/20 text-[#A4AABC]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#A4AABC] leading-relaxed">
                Synapse defaults to ultra-fast **Groq (GPT-OSS 120B)** with zero latency. If you prefer your own custom
                Groq (`gsk_...`) or Google Gemini (`AIzaSy...`) key, configure it below:
              </p>

              <div>
                <label className="block mb-1 font-bold text-[#F5F7FC]">API Key (Groq / Gemini)</label>
                <input
                  type="password"
                  placeholder="gsk_... or AIzaSy..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#242A3A] bg-[#151A29] text-white text-xs font-mono focus:outline-none focus:border-[#C8FF00]"
                />
                <div className="flex items-center justify-between text-[11px] text-[#C8FF00] mt-1.5">
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>Get free Groq key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 text-slate-400"
                  >
                    <span>Google Gemini</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setTempApiKey('');
                    setCustomApiKey('');
                    localStorage.removeItem('habytat_custom_ai_key');
                    setApiKeyModalOpen(false);
                  }}
                  className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Reset Default
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-black transition-all shadow-md shadow-[#C8FF00]/20"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
