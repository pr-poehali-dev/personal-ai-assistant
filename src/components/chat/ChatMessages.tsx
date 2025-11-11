import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  hasFile?: boolean;
  fileName?: string;
  imageUrl?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraOn: boolean;
  isListening?: boolean;
}

export const ChatMessages = ({ 
  messages, 
  isLoading, 
  videoRef, 
  isCameraOn,
  isListening = false
}: ChatMessagesProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
        >
          <div
            className={`max-w-[75%] p-4 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {message.hasFile && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-current/10">
                <Icon name="Paperclip" size={16} />
                <span className="text-sm">{message.fileName}</span>
              </div>
            )}
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            {message.imageUrl && (
              <img 
                src={message.imageUrl} 
                alt="Generated" 
                className="mt-2 rounded-lg max-w-full"
              />
            )}
            <span className="text-xs opacity-70 mt-1 block">
              {message.timestamp.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-muted p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      {isCameraOn && (
        <Card className="p-4 mb-4 border-green-500 border-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-green-600">
              <Icon name="Video" size={16} />
              <span className="text-sm font-medium">Камера активна</span>
            </div>
            {isListening && (
              <div className="flex items-center gap-2 text-red-600 animate-pulse">
                <Icon name="Mic" size={16} />
                <span className="text-sm font-medium">Слушаю...</span>
              </div>
            )}
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg"
          />
        </Card>
      )}
    </div>
  );
};