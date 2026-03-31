import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, FileText } from 'lucide-react';
import { ragService } from '../../services/ragService';

interface SourceDocument {
  name: string;
  fileName: string;
  chunks_used: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sourceDocuments?: SourceDocument[];
}

interface ClinicalChatbotProps {
  batchId?: string;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

export type { Message };

export const ClinicalChatbot: React.FC<ClinicalChatbotProps> = ({ batchId, initialMessages, onMessagesChange }) => {
  console.log('ClinicalChatbot initialized with batchId:', batchId);
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Only load chat history if no initial messages provided
    if (!initialMessages || initialMessages.length === 0) {
      loadChatHistory();
    } else {
      setIsLoadingHistory(false);
    }
  }, [batchId]);

  // Notify parent of message changes for persistence
  useEffect(() => {
    if (onMessagesChange && messages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // For now, just show welcome message since RAG API doesn't have persistent history
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          content: 'Hello! I\'m your AI Clinical Assistant. I can answer questions about this patient\'s medical records, medications, lab results, diagnoses, and more. How can I help you today?',
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setMessages([
        {
          id: 'welcome',
          type: 'assistant',
          content: 'Hello! I\'m your AI Clinical Assistant. I can answer questions about this patient\'s medical records, medications, lab results, diagnoses, and more. How can I help you today?',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Use the RAG API endpoint
      const response = await ragService.askChatbot(
        userMessage.content,
        batchId
      );

      if (response.success) {
        console.log('Chatbot response:', response);
        console.log('Source documents from response:', response.sourceDocuments);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sourceDocuments: response.sourceDocuments || []
        };

        console.log('Assistant message with source docs:', assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      
      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What medications is the patient currently taking?",
    "What are the patient's recent diagnoses?",
    "Show me the latest lab results",
    "What allergies does the patient have?",
    "Summarize the patient's medical history"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 rounded-t-lg">
        <div className="flex items-center">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Clinical Assistant</h3>
            <p className="text-xs text-blue-100">Powered by RAG Technology</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading chat history...</span>
            </div>
          </div>
        ) : (
          <>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-green-100'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col">
                <div className={`rounded-lg px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {/* Source Documents */}
                {message.type === 'assistant' && (() => {
                  console.log('Message:', message.id, 'Type:', message.type, 'Has sourceDocuments:', !!message.sourceDocuments, 'Length:', message.sourceDocuments?.length);
                  return message.sourceDocuments && message.sourceDocuments.length > 0;
                })() && message.sourceDocuments && (
                  <div className="mt-2 ml-0">
                    <div className="text-xs text-gray-600 mb-1 font-medium">Sources:</div>
                    <div className="flex flex-wrap gap-2">
                      {message.sourceDocuments.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700"
                          title={`Used ${doc.chunks_used} chunk${doc.chunks_used > 1 ? 's' : ''} from this document`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="font-medium">{doc.name}</span>
                          <span className="ml-1 text-blue-500">({doc.chunks_used})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start max-w-3xl">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                  <Bot className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="rounded-lg px-4 py-3 bg-gray-100">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </>
        )}
      </div>

      {/* Suggested Questions (only show when no messages except welcome) */}
      {!isLoadingHistory && messages.length <= 1 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Suggested Questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this patient..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="font-medium">Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};
