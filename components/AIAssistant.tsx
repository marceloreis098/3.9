import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './common/Icon';
import { streamChat } from '../services/geminiService';
import { User, AppSettings, ChatMessage } from '../types';

interface AIAssistantProps {
    user: User;
    settings: Partial<AppSettings>;
    onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ user, settings, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isStreaming = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        setMessages([
            {
                role: 'model',
                text: `Olá, ${user.realName}! Sou seu assistente de IA para o sistema de inventário. Como posso ajudar hoje?`
            }
        ]);
    }, [user.realName]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || isStreaming.current) return;
        
        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        isStreaming.current = true;

        let fullResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        await streamChat({
            history: messages,
            message: input,
            model: settings.geminiModel || 'gemini-2.5-flash',
            systemInstruction: settings.aiSystemInstruction || 'Você é um assistente prestativo.',
            onChunk: (chunk) => {
                fullResponse += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: fullResponse };
                    return newMessages;
                });
            },
            onComplete: () => {
                setIsLoading(false);
                isStreaming.current = false;
            },
            onError: (error) => {
                setMessages(prev => [...prev, { role: 'model', text: `Desculpe, ocorreu um erro: ${error}` }]);
                setIsLoading(false);
                isStreaming.current = false;
            }
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <div className="fixed bottom-24 right-4 sm:right-6 md:right-8 w-[calc(100%-2rem)] max-w-sm h-[60vh] max-h-[500px] bg-white dark:bg-dark-card shadow-2xl rounded-lg flex flex-col z-40 animate-fade-in-up">
            <header className="flex items-center justify-between p-3 bg-brand-secondary text-white rounded-t-lg flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Icon name="Bot" size={20} />
                    <h3 className="font-bold text-lg">Assistente AI</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                    <Icon name="X" size={20} />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <Icon name="Bot" size={24} className="flex-shrink-0 text-brand-primary" />}
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text-primary'}`}>
                           <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                   {msg.text}
                               </ReactMarkdown>
                           </div>
                        </div>
                         {msg.role === 'user' && <Icon name="User" size={24} className="flex-shrink-0 text-gray-500" />}
                    </div>
                ))}
                 {isLoading && messages[messages.length - 1].role === 'user' && (
                    <div className="flex gap-3">
                        <Icon name="Bot" size={24} className="flex-shrink-0 text-brand-primary" />
                        <div className="max-w-[85%] p-3 rounded-lg bg-gray-100 dark:bg-dark-bg flex items-center">
                           <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                           <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:-0.15s] mx-1"></div>
                           <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-3 border-t dark:border-dark-border flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-bg rounded-lg">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua pergunta..."
                        rows={1}
                        className="flex-1 p-2 bg-transparent resize-none focus:outline-none max-h-24"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 text-brand-primary disabled:text-gray-400 disabled:cursor-not-allowed">
                        <Icon name="Send" size={20} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AIAssistant;