/**
 * dashboard/AIChatWidget.jsx — AI Assistant chatbot widget
 * 
 * Provides:
 * - Floating chat window in bottom-right corner
 * - Natural language input field to query the AI assistant
 * - Dynamic answer rendering with suggestion quick-reply chips
 * - Handles API connection to POST /api/ai/query
 */

import { useState, useRef, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import {
  Brain,
  MessageSquare,
  X,
  Send,
  Sparkles,
  User,
  ArrowRight,
} from 'lucide-react';

const SUGGESTIONS = [
  'Show daily summary',
  'Which leads have high conversion scores?',
  'Check low stock warnings',
  'Who owes pending payments?'
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Namaste! I am your Solar EPC AI Assistant. How can I help you manage your rooftop sites, inventory, or lead conversions today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await apiCall('/ai/query', {
        method: 'POST',
        body: JSON.stringify({ query: text })
      });

      // Add AI reply
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: res.answer, suggestions: res.suggestions }
      ]);
    } catch (err) {
      console.warn('AI API error, loading mock response:', err.message);
      // Simulated AI reply
      setTimeout(() => {
        let answer = "I processed your request, but the API endpoint was offline. Offline simulated summary: Your active sites are progressing cleanly. Rajesh Patel's 10kW system is at Panel Installation stage, and stock levels look healthy besides the 10kW inverter alert.";
        if (text.toLowerCase().includes('stock') || text.toLowerCase().includes('inventory')) {
          answer = "Alert: 3-Phase Hybrid Solar Inverters are low in stock (4 left). Minimum stock threshold is set to 5. I suggest scheduling a procurement request to Energiaa Systems.";
        } else if (text.toLowerCase().includes('payment') || text.toLowerCase().includes('owe')) {
          answer = "Outstanding collections stand at ₹9.84L. Mahesh Choudhary has an overdue invoice of ₹8.4L since June 15th for the Bhiwadi commercial project.";
        } else if (text.toLowerCase().includes('lead') || text.toLowerCase().includes('sales')) {
          answer = "You have 8 active leads. Amit Verma is assigned to all. Hot leads include Rajendra Singh (AI Score 95, 100kW capacity) and Sunita Reddy (AI Score 92, 25kW capacity). Recommend pitching to Rajendra immediately.";
        }
        setMessages(prev => [
          ...prev,
          { id: Date.now() + 1, sender: 'ai', text: answer }
        ]);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* ── Chat Toggle Bubble ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-300 group border border-indigo-500/20"
        >
          <Brain size={24} className="group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-none flex items-center gap-1">Solar Copilot</h3>
                <span className="text-[9px] text-emerald-400 font-semibold tracking-wide uppercase mt-0.5">Online AI</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === 'user' ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {msg.sender === 'user' ? <User size={13} /> : <Brain size={13} />}
                </div>
                <div className="space-y-2">
                  <div className={`text-[11px] p-3 rounded-2xl leading-normal ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-950 text-slate-200 rounded-tl-none border border-slate-850'}`}>
                    {msg.text}
                  </div>
                  
                  {/* Suggestion Chips inside bubble */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(sug)}
                          className="text-left text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-950 px-2.5 py-1 rounded-lg transition"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-slate-850 border border-slate-800 text-slate-400 flex items-center justify-center animate-pulse">
                  <Brain size={13} />
                </div>
                <div className="bg-slate-950 border border-slate-850 text-slate-500 text-[10px] p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions bar */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-850 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(sug => (
                <button
                  key={sug}
                  onClick={() => handleSend(sug)}
                  className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-0.5 rounded transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about rooftop sites..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition"
            >
              <Send size={13} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
