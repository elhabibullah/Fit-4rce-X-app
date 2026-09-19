
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

  const quickPrompts = [
    translate('chatbot.quick.squat'),
    translate('chatbot.quick.abs'),
    translate('chatbot.quick.recovery'),
  ];

  return (
    <div 
      className="fixed inset-x-0 top-0 bottom-20 bg-black/90 backdrop-blur-md z-[99999] flex flex-col justify-start items-center p-3 font-['Poppins'] animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg h-full flex flex-col bg-gray-900 overflow-hidden shadow-2xl rounded-2xl border-2 border-[#8A2BE2]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-black border border-[#8A2BE2] flex items-center justify-center mr-2.5 shadow-[0_0_10px_rgba(138,43,226,0.5)]">
                 <Bot className="w-4 h-4 text-[#8A2BE2]" />
            </div>
            <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">{translate('chatbot.title')}</h2>
                <p className="text-[9px] text-purple-400 font-mono tracking-wider">ONLINE // SYSTEM READY</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all"
            aria-label="Fermer le chat"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable messages container with prominent custom visible scrollbar */}
        <main className="flex-1 min-h-0 overflow-y-scroll overscroll-contain p-3 space-y-3 bg-black/60 chatbot-scrollbar [scrollbar-width:thin] [scrollbar-color:#8A2BE2_#18181b]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-black flex-shrink-0 flex items-center justify-center border border-gray-600 self-start mt-1">
                    <Bot size={15} className="text-[#8A2BE2]" />
                </div>
              )}
              
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm shadow-md ${
                    msg.role === 'user' 
                    ? 'bg-[#8A2BE2] text-white font-medium rounded-br-none' 
                    : 'bg-gray-800 text-white rounded-tl-none border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed text-gray-100 font-sans break-words">
                    {msg.role === 'ai' ? cleanTextForDisplay(msg.content) : msg.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-2.5">
               <div className="w-7 h-7 rounded-full bg-black flex-shrink-0 flex items-center justify-center border border-gray-600"><Bot size={15} className="text-[#8A2BE2]" /></div>
               <div className="p-3 rounded-2xl bg-gray-800 rounded-tl-none border border-gray-700">
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

        <footer className="flex-shrink-0 p-2.5 sm:p-3 border-t border-gray-800 bg-gray-950 z-30">
          {/* Quick suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1.5 no-scrollbar">
            {quickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-[11px] bg-zinc-900 hover:bg-[#8A2BE2]/20 hover:border-[#8A2BE2] text-zinc-300 hover:text-white border border-zinc-800 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 w-full"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={translate('chatbot.inputPlaceholder')}
              className="flex-1 min-w-0 bg-gray-900 border border-purple-500/50 focus:border-[#8A2BE2] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-[#8A2BE2] transition-all shadow-inner"
              disabled={isLoading}
              autoComplete="off"
            />
            <button 
              type="submit"
              disabled={isLoading || input.trim() === ''} 
              className="w-11 h-11 bg-[#8A2BE2] hover:bg-purple-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex-shrink-0 flex items-center justify-center cursor-pointer text-white"
              aria-label={translate('chatbot.send')}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;
