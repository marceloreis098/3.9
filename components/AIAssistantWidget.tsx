import React, { useState } from 'react';
import Icon from './common/Icon';
import AIAssistant from './AIAssistant';
import { User, AppSettings } from '../types';

interface AIAssistantWidgetProps {
    user: User;
    settings: Partial<AppSettings>;
}

const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({ user, settings }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!settings.aiAssistantEnabled) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 sm:right-6 md:right-8 bg-brand-secondary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-brand-dark transition-transform hover:scale-110 animate-scale-in"
                aria-label="Abrir Assistente AI"
            >
                <Icon name="Bot" size={32} />
            </button>
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/30 z-30"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    ></div>
                    <AIAssistant user={user} settings={settings} onClose={() => setIsOpen(false)} />
                </>
            )}
        </>
    );
};

export default AIAssistantWidget;