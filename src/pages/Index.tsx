import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Index = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я Ванёк — твой персональный ИИ-помощник. Готов помочь с любой задачей.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Понял твой запрос. Сейчас обработаю и вернусь с результатом.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
  };

  const quickActions = [
    { icon: 'Image', label: 'Создать изображение', color: 'bg-purple-500' },
    { icon: 'Video', label: 'Сгенерировать видео', color: 'bg-pink-500' },
    { icon: 'Code', label: 'Написать код', color: 'bg-blue-500' },
    { icon: 'FileText', label: 'Анализ файлов', color: 'bg-green-500' },
    { icon: 'Gamepad2', label: 'Создать игру', color: 'bg-orange-500' },
    { icon: 'Search', label: 'Найти софт', color: 'bg-cyan-500' }
  ];

  return (
    <div className="min-h-screen bg-background dark flex">
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-8 right-8 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <Icon name="Settings" size={16} />
            Админка
          </Button>
        </div>

        <div className="w-full max-w-6xl flex flex-col items-center gap-8">
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-black border-4 border-primary animate-pulse-glow transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
              </div>
            </div>
          </div>

          <div className="text-center animate-fade-in">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Ванёк
            </h1>
            <p className="text-muted-foreground text-lg">Персональный ИИ-помощник</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 w-full max-w-3xl animate-slide-up">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card hover:bg-accent transition-all duration-300 hover:scale-105 group"
              >
                <div className={`${action.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon name={action.icon as any} size={20} className="text-white" />
                </div>
                <span className="text-xs text-center text-muted-foreground group-hover:text-foreground">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          <Card className="w-full max-w-3xl p-6 bg-card/50 backdrop-blur-sm border-primary/20 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Icon name="MessageSquare" size={14} />
                  {isVoiceMode ? 'Голосовой режим' : 'Текстовый режим'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className="gap-2"
              >
                <Icon name={isVoiceMode ? 'Keyboard' : 'Mic'} size={16} />
                {isVoiceMode ? 'Текст' : 'Голос'}
              </Button>
            </div>

            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto custom-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {!isVoiceMode ? (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Введи свой запрос..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-[60px] w-[60px] shrink-0"
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleVoiceToggle}
                  size="lg"
                  className={`w-32 h-32 rounded-full ${
                    isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
                  }`}
                >
                  <Icon name="Mic" size={48} />
                </Button>
                <p className="text-sm text-muted-foreground">
                  {isRecording ? 'Слушаю...' : 'Нажми для начала записи'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
      `}</style>
    </div>
  );
};

export default Index;
