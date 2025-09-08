// src/hooks/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { chatWithOpenRouter } from '../services/chatService';
import { FlatList } from 'react-native';

// O tipo da mensagem pode ser movido para um arquivo de tipos compartilhado
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Função para adicionar uma nova mensagem e atualizar o estado
  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    // Garante que a lista role para o final após a renderização da nova mensagem
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // Usar algo mais robusto que Date.now() para IDs é uma boa prática
    // para evitar colisões, especialmente em apps mais complexos.
    // Ex: uuid, ou uma combinação como esta para simplicidade.
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: trimmedInput,
    };
    addMessage(userMessage);
    setInput('');
    setLoading(true);

    try {
      const assistantText = await chatWithOpenRouter(trimmedInput);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: assistantText,
      };
      addMessage(assistantMessage);
    } catch (err) {
      console.error("Chat API error:", err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}-${Math.random()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao contatar o assistente. Por favor, tente novamente.',
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return {
    messages,
    input,
    loading,
    listRef,
    setInput,
    sendMessage,
  };
};