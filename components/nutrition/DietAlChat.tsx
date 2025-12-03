
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';
// FIX: Corrected import path from geminiService to aiService
import { getDietAlResponse } from '../../services/aiService.ts';
import { useApp } from '../../hooks/useApp.ts';
import { Apple } from 'lucide-react';
import { Language } from '../../types.ts';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400">{subtitle}</p>
  </div>
);


const DietAlChat: React.FC = () => {
  const { translate, profile, language } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'ai', content: translate('nutrition.chat.greeting') }]);
  }, [translate]);

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

    const aiResponse = await getDietAlResponse(userMessage.content, profile, language);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] animate-fadeIn">
        <DietAlHeader title={translate('nutrition.chat.title')} subtitle={translate('nutrition.chat.subtitle')} />
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-black rounded-2xl border border-gray-800 shadow-sm">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center"><Bot size={20} className="text-green-500" /></div>}
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-green-500 text-white font-medium rounded-br-none' : 'bg-gray-800 text-white rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-2">
               <div className="w-8 h-8 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center"><Bot size={20} className="text-green-500" /></div>
               <div className="p-3 rounded-2xl bg-gray-800 rounded-bl-none">
                  <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="pt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={translate('nutrition.chat.inputPlaceholder')}
              className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="p-3 bg-gray-800 border border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-6 h-6 text-green-500" />
            </button>
          </div>
        </footer>
    </div>
  );
};

export default DietAlChat;
