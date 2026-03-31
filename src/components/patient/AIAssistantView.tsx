import React from 'react';
import { ClinicalChatbot, Message } from './ClinicalChatbot';

interface AIAssistantViewProps {
  batchId?: string;
  chatHistory?: Message[];
  onChatHistoryChange?: (messages: Message[]) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ batchId, chatHistory, onChatHistoryChange }) => {
  console.log('AIAssistantView received batchId:', batchId);
  return (
    <div className="h-full">
      <ClinicalChatbot 
        batchId={batchId} 
        initialMessages={chatHistory}
        onMessagesChange={onChatHistoryChange}
      />
    </div>
  );
};
