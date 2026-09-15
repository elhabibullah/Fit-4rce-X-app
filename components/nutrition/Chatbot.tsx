
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { getChatbotResponse } from '../../services/aiService.ts';
import { useApp } from '../../hooks/useApp.ts';

interface ChatbotProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

// UI-LEVEL SANITIZER: The Last Line of Defense
// This function runs directly in the render loop to ensure no code is ever shown.
const cleanTextForDisplay = (text: string) => {
    let clean = text;
    // Remove markdown code blocks
    clean = clean.replace(/```[\s\S]*?```/g, '');
    // Remove inline code
    clean = clean.replace(/`[^`]*`/g, '');
    // Remove raw JSON looking structures (blocks starting with { or [)
    clean = clean.replace(/^\s*[\{\[][\s\S]*[\}\]]\s*$/gm, '');
    
    // Aggressive line-by-line purge of code keywords
    const lines = clean.split('\n');
    const safeLines = lines.filter(line => {
        const t = line.trim();
        if (/^(const|import|function|let|var|return|console|interface|type)\s+/.test(t)) return false;
        // If line ends with semicolon and has code-like symbols, unlikely to be chat
        if (/;$/.test(t) && /[\(\)\=\>]/.test(t)) return false;
        // If line starts with JSON-like key
        if (/^\s*"\w+"\s*:/.test(t)) return false;
        return true;
    });
    
    clean = safeLines.join('\n');
    
    const trimmed = clean.trim();
    return trimmed.length > 0 ? trimmed : "I am focused on your fitness. Let's discuss your workout plan.";
};

const Chatbot: React.FC<ChatbotProps> = ({ isVisible, onClose }) => {
  const { translate, language } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setMessages([{ role: 'ai', content: translate('chatbot.greeting') }]);
  }, [translate, language]);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (messageContent === '' || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const aiResponse = await getChatbotResponse(userMessage.content, language);
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'ai', content: translate('coach.status.conn_error') }]);
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (!isVisible) return null;

  const quickPrompts = language === 'fr' ? [
    'Comment bien faire le squat ?',
    'Exercices abdominaux',
    'Conseils récupération',
  ] : [
    'How to do a proper squat?',
    'Core exercises',
    'Recovery tips',
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl h-[92vh] sm:h-[85vh] max-h-screen bg-gray-900 border-t-2 sm:border border-[#8A2BE2] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between p-3.5 sm:p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-black border border-[#8A2BE2] flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(138,43,226,0.5)]">
                 <Bot className="w-6 h-6 text-[#8A2BE2]" />
            </div>
            <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{translate('chatbot.title')}</h2>
                <p className="text-[11px] text-purple-400 font-mono tracking-wider">ONLINE // SYSTEM READY</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
            aria-label="Fermer le chat"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-black/40 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-black flex-shrink-0 flex items-center justify-center border border-gray-600 self-start mt-1">
                    <Bot size={18} className="text-[#8A2BE2]" />
                </div>
              )}
              
              <div 
                className={`max-w-[90%] md:max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-sm shadow-md ${
                    msg.role === 'user' 
                    ? 'bg-[#8A2BE2] text-white font-medium rounded-br-none' 
                    : 'bg-gray-800 text-white rounded-tl-none border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-gray-100 font-sans">
                    {/* Apply visual cleaning logic at render time */}
                    {msg.role === 'ai' ? cleanTextForDisplay(msg.content) : msg.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-3">
               <div className="w-8 h-8 rounded-full bg-black flex-shrink-0 flex items-center justify-center border border-gray-600"><Bot size={18} className="text-[#8A2BE2]" /></div>
               <div className="p-4 rounded-2xl bg-gray-800 rounded-tl-none border border-gray-700">
                  <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-[#8A2BE2] rounded-full animate-bounce"></div>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-700 bg-gray-950 flex flex-col gap-2.5 z-10">
          {/* Quick suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-xs bg-zinc-800 hover:bg-[#8A2BE2]/30 hover:border-[#8A2BE2] text-zinc-300 hover:text-white border border-zinc-700 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex-grow relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={translate('chatbot.inputPlaceholder') || (language === 'fr' ? 'Écrivez votre message ici...' : 'Type your message here...')}
                className="w-full bg-black/80 border-2 border-[#8A2BE2]/60 focus:border-[#8A2BE2] rounded-xl px-4 py-3.5 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]/40 transition-all cursor-text select-text"
                disabled={isLoading}
                autoFocus
                autoComplete="off"
              />
            </div>
            <button 
                onClick={() => handleSend()} 
                disabled={isLoading || input.trim() === ''} 
                className="p-3.5 bg-[#8A2BE2] rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(138,43,226,0.4)] flex-shrink-0 flex items-center justify-center"
                aria-label="Envoyer"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;
