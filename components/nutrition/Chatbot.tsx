
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
  const { translate } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{ role: 'ai', content: translate('chatbot.greeting') }]);
    }
  }, [translate, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const aiResponse = await getChatbotResponse(userMessage.content);
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'ai', content: "Connection error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex flex-col justify-end animate-fadeIn">
      <div className="w-full max-w-2xl mx-auto h-[90vh] bg-gray-900/95 backdrop-blur-xl border-t-2 border-[#8A2BE2] rounded-t-2xl shadow-2xl flex flex-col animate-slideInUp">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-black border border-[#8A2BE2] flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(138,43,226,0.5)]">
                 <Bot className="w-6 h-6 text-[#8A2BE2]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">{translate('chatbot.title')}</h2>
                <p className="text-xs text-purple-400 font-mono">ONLINE // SYSTEM READY</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all">
            <X className="w-7 h-7" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-black/40 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-black flex-shrink-0 flex items-center justify-center border border-gray-600 self-start mt-1">
                    <Bot size={18} className="text-[#8A2BE2]" />
                </div>
              )}
              
              <div 
                className={`max-w-[90%] md:max-w-[85%] p-4 rounded-2xl text-sm shadow-md ${
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

        <footer className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={translate('chatbot.inputPlaceholder')}
              className="flex-grow bg-black/50 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent transition-all"
              disabled={isLoading}
              autoComplete="off"
            />
            <button 
                onClick={handleSend} 
                disabled={isLoading || input.trim() === ''} 
                className="p-4 bg-[#8A2BE2] rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(138,43,226,0.4)]"
            >
              <Send className="w-6 h-6 text-white" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;
