import { ChatMessage } from '../types';

interface StreamChatProps {
    history: ChatMessage[];
    message: string;
    model: string;
    systemInstruction: string;
    onChunk: (chunk: string) => void;
    onComplete: () => void;
    onError: (error: string) => void;
}

// Type for Gemini API history format used by the backend
interface GeminiContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const getApiBaseUrl = () => {
    return `http://${window.location.hostname}:3001/api`;
};

export const streamChat = async ({
    history,
    message,
    model,
    systemInstruction,
    onChunk,
    onComplete,
    onError,
}: StreamChatProps) => {
    try {
        // Convert frontend ChatMessage format to the format expected by the Gemini API/backend
        const apiHistory: GeminiContent[] = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const response = await fetch(`${getApiBaseUrl()}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                history: apiHistory, 
                message, 
                model, 
                systemInstruction 
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Ocorreu um erro no servidor (status: ${response.status})` }));
            throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Não foi possível ler a resposta do servidor.");
        }

        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            onChunk(decoder.decode(value, { stream: true }));
        }
        
        onComplete();

    } catch (error: any) {
        console.error("Chat streaming error:", error);
        onError(error.message || "Ocorreu um erro na comunicação com o assistente.");
    }
};