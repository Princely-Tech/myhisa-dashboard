'use client';

import React, { useState, useRef, useEffect } from 'react';
import { message as antMessage } from 'antd';
import { aiService, ChatMessage } from '@/utils/api/aiService';
import MessageList, { Message } from './MessageList';
import MessageInput from './MessageInput';
import DataDisplay from './DataDisplay';
import TypingIndicator from './TypingIndicator';
import QuickActions from './QuickActions';
import ErrorMessage from './ErrorMessage';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [lastFailedMessage, setLastFailedMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = antMessage.useMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, errorMessage]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    setErrorMessage('');
    setLastFailedMessage('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
      isSending: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, isSending: false } : msg
        )
      );
    }, 500);

    try {
      const response = await aiService.chat({
        message: textToSend,
        history: conversationHistory,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        data: response.data.data,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setConversationHistory(response.data.metadata.conversation_history);
    } catch (error: any) {
      setLastFailedMessage(textToSend);
      const errorMsg = error.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      setErrorMessage(errorMsg);
      messageApi.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  };

  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {contextHolder}
      <div className="flex flex-col h-full w-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-5 px-6 text-center shadow-xl relative flex-shrink-0">
          <div className="absolute inset-0 bg-white opacity-10 animate-pulse-slow"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1 flex items-center justify-center gap-2">
              <span className="text-2xl">🤖</span>
              HISA AI Assistant
            </h2>
            <p className="text-xs opacity-90 leading-relaxed">
              Your intelligent companion for transactions, balance, data plans, and more!
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white min-h-0">
          {messages.length === 0 ? (
            <QuickActions onActionClick={handleQuickAction} />
          ) : (
            <>
              <MessageList messages={messages} />
              {isLoading && <TypingIndicator />}
              {errorMessage && !isLoading && (
                <ErrorMessage message={errorMessage} onRetry={handleRetry} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0">
          <MessageInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>
      </div>
    </>
  );
};

export default AIChat;
