import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  hasFile?: boolean;
  fileName?: string;
  imageUrl?: string;
}

declare global {
  interface Window {
    puter: any;
  }
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я Ванёк — твой персональный ИИ-помощник. Могу общаться, генерировать изображения, анализировать файлы и даже видеть через камеру!',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ data: string; type: string; name: string } | null>(null);
  const [isPuterReady, setIsPuterReady] = useState(false);

  useEffect(() => {
    const initPuter = async () => {
      try {
        if (window.puter) {
          await window.puter.auth.signIn({ appID: 'ai-assistant-vanek' });
          setIsPuterReady(true);
          console.log('Puter.js инициализирован');
        }
      } catch (error) {
        console.log('Puter авторизация пропущена:', error);
        setIsPuterReady(true);
      }
    };

    if (document.readyState === 'complete') {
      initPuter();
    } else {
      window.addEventListener('load', initPuter);
      return () => window.removeEventListener('load', initPuter);
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraOn(true);
        toast({
          title: 'Камера включена',
          description: 'Теперь я вижу тебя!',
        });
      }
    } catch (error) {
      console.error('Ошибка камеры:', error);
      setIsCameraOn(false);
      toast({
        title: 'Камера недоступна',
        description: 'Разрешите доступ к камере в настройках браузера',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !currentFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue || (currentFile ? `Анализирую файл: ${currentFile.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      hasFile: !!currentFile,
      fileName: currentFile?.name
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue.trim();
    const fileToSend = currentFile;
    setInputValue('');
    setCurrentFile(null);
    setIsLoading(true);

    try {
      if (!isPuterReady || !window.puter) {
        throw new Error('AI не готов. Перезагрузите страницу.');
      }

      const isImageRequest = messageText.toLowerCase().includes('нарисуй') || 
                            messageText.toLowerCase().includes('создай изображение') ||
                            messageText.toLowerCase().includes('сгенерируй картинку');

      const isCameraRequest = messageText.toLowerCase().includes('вид') && 
                             (messageText.toLowerCase().includes('меня') || 
                              messageText.toLowerCase().includes('камер'));

      if (isImageRequest) {
        const imagePrompt = messageText.replace(/нарисуй|создай изображение|сгенерируй картинку/gi, '').trim();
        
        try {
          const imageResponse = await window.puter.ai.txt2img(imagePrompt || 'красивый пейзаж');
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const aiResponse: Message = {
              id: Date.now().toString(),
              text: `Вот что получилось по запросу: "${imagePrompt}"`,
              sender: 'ai',
              timestamp: new Date(),
              imageUrl: e.target?.result as string
            };
            setMessages(prev => [...prev, aiResponse]);
          };
          reader.readAsDataURL(imageResponse);
        } catch (imgError) {
          console.error('Ошибка генерации:', imgError);
          throw new Error('Не удалось сгенерировать изображение');
        }
      } else {
        let systemPrompt = 'Ты — Ванёк, персональный ИИ-помощник. Стиль: краткий, уверенный, как старый друг. Отвечай по делу без воды. Можешь генерировать изображения (скажи "нарисуй..."), анализировать файлы и видеть через камеру.';
        
        let userPrompt = messageText;
        
        if (isCameraRequest && isCameraOn) {
          const frame = captureFrame();
          if (frame) {
            userPrompt = `${messageText}\n\n[Отправил фото с камеры]`;
            systemPrompt += ' Пользователь прислал своё фото с веб-камеры. Опиши что видишь.';
          }
        }
        
        if (fileToSend) {
          if (fileToSend.type.startsWith('image/')) {
            userPrompt = `${messageText}\n\n[Изображение: ${fileToSend.name}]`;
          } else {
            try {
              const fileContent = atob(fileToSend.data);
              userPrompt = `${messageText}\n\nСодержимое файла ${fileToSend.name}:\n${fileContent.substring(0, 4000)}`;
            } catch (e) {
              userPrompt = `${messageText}\n\n[Файл: ${fileToSend.name} - бинарный формат]`;
            }
          }
        }

        const conversationHistory = messages.slice(-8).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        conversationHistory.unshift({ role: 'system', content: systemPrompt });
        conversationHistory.push({ role: 'user', content: userPrompt });

        const response = await window.puter.ai.chat(conversationHistory);
        
        const aiReply = response?.message?.content || response?.text || response?.toString() || 'Не удалось получить ответ';

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: aiReply,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error: any) {
      console.error('Ошибка AI:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Извини, возникла проблема: ${error.message || 'Неизвестная ошибка'}. Попробуй ещё раз или перезагрузи страницу.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    toast({
      title: 'Голосовой ввод',
      description: 'Функция в активной разработке',
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Файл слишком большой',
        description: 'Максимальный размер: 10 МБ',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      
      setCurrentFile({
        data: base64Data,
        type: file.type,
        name: file.name
      });

      toast({
        title: 'Файл загружен',
        description: `${file.name} готов к анализу`,
      });
    };
    reader.readAsDataURL(file);
  };

  const quickActions = [
    { 
      icon: 'Image', 
      label: 'Создать изображение', 
      color: 'bg-purple-500',
      action: () => setInputValue('Нарисуй ')
    },
    { 
      icon: 'Video', 
      label: 'Включить камеру', 
      color: 'bg-pink-500',
      action: toggleCamera
    },
    { 
      icon: 'Code', 
      label: 'Написать код', 
      color: 'bg-blue-500',
      action: () => setInputValue('Напиши код для ')
    },
    { 
      icon: 'FileText', 
      label: 'Анализ файлов', 
      color: 'bg-green-500', 
      action: () => fileInputRef.current?.click() 
    },
    { 
      icon: 'Lightbulb', 
      label: 'Придумать идею', 
      color: 'bg-yellow-500',
      action: () => setInputValue('Придумай идею для ')
    },
    { 
      icon: 'BookOpen', 
      label: 'Объяснить тему', 
      color: 'bg-cyan-500',
      action: () => setInputValue('Объясни мне ')
    }
  ];

  return (
    <div className="min-h-screen bg-background dark flex">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-8 right-8 z-10 flex items-center gap-2">
          <Badge variant={isPuterReady ? 'default' : 'destructive'}>
            {isPuterReady ? 'AI готов' : 'Загрузка...'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCamera}
            className="gap-2"
          >
            <Icon name={isCameraOn ? 'VideoOff' : 'Video'} size={16} />
            {isCameraOn ? 'Выкл' : 'Вкл'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-2"
          >
            <Icon name="Settings" size={16} />
          </Button>
        </div>

        <div className="w-full max-w-6xl flex flex-col items-center gap-8">
          <div className="flex items-center justify-center gap-8 mb-4">
            {isCameraOn && (
              <div className="relative animate-fade-in">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-40 h-40 rounded-full object-cover border-4 border-primary shadow-lg"
                />
                <div className="absolute bottom-2 right-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>
            )}
            
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-black border-4 border-primary animate-pulse-glow transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
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
                onClick={action.action}
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

          <Card 
            className={`w-full max-w-3xl p-6 bg-card/50 backdrop-blur-sm border-primary/20 animate-fade-in transition-all ${
              isDragging ? 'border-primary border-2 bg-primary/10' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Icon name="MessageSquare" size={14} />
                  {isVoiceMode ? 'Голос' : 'Текст'}
                </Badge>
                {currentFile && (
                  <Badge variant="secondary" className="gap-1">
                    <Icon name="Paperclip" size={14} />
                    {currentFile.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Icon name="Paperclip" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  className="gap-2"
                >
                  <Icon name={isVoiceMode ? 'Keyboard' : 'Mic'} size={16} />
                </Button>
              </div>
            </div>

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg backdrop-blur-sm z-10">
                <div className="text-center">
                  <Icon name="Upload" size={48} className="mx-auto mb-2 text-primary" />
                  <p className="text-lg font-semibold">Отпусти файл</p>
                </div>
              </div>
            )}

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
                    {message.hasFile && (
                      <div className="flex items-center gap-2 mb-2 text-xs opacity-80">
                        <Icon name="Paperclip" size={14} />
                        {message.fileName}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isVoiceMode ? (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Спроси меня о чём угодно, попроси нарисовать или загрузи файл..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[60px] resize-none"
                  disabled={isLoading || !isPuterReady}
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-[60px] w-[60px] shrink-0"
                  disabled={isLoading || !isPuterReady || (!inputValue.trim() && !currentFile)}
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
                  {isRecording ? 'Слушаю...' : 'Нажми для записи'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />

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
