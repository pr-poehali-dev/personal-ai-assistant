import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/components/chat/ChatMessages';
import FUNC_URLS from '../../backend/func2url.json';

const BACKEND_SAVE = FUNC_URLS['save-message'];
const BACKEND_CHAT = FUNC_URLS['ai-chat'];
const BACKEND_IMAGE = FUNC_URLS['ai-image'];

declare global {
  interface Window {
    speechSynthesis: SpeechSynthesis;
    SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
  }
}

export const useChatLogic = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionIdRef = useRef<string>(Date.now().toString() + Math.random().toString(36).substring(7));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ data: string; type: string; name: string } | null>(null);
  const [isAiReady, setIsAiReady] = useState(true);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);

  useEffect(() => {
    loadMessagesFromDB();
  }, []);

  const loadMessagesFromDB = async () => {
    try {
      const response = await fetch(`${BACKEND_SAVE}?sessionId=${sessionIdRef.current}`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const loadedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          hasFile: msg.hasFile,
          fileName: msg.fileName,
          imageUrl: msg.imageUrl
        }));
        setMessages(loadedMessages);
      } else {
        const welcomeMessage: Message = {
          id: '1',
          text: 'Привет! Я Ванёк — твой персональный ИИ-помощник на базе GPT-4. Могу общаться, генерировать изображения через DALL-E, анализировать файлы и даже видеть через камеру!',
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        await saveMessageToDB(welcomeMessage);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      const welcomeMessage: Message = {
        id: '1',
        text: 'Привет! Я Ванёк — твой персональный ИИ-помощник на базе GPT-4. Могу общаться, генерировать изображения через DALL-E, анализировать файлы и даже видеть через камеру!',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  const saveMessageToDB = async (message: Message) => {
    try {
      await fetch(BACKEND_SAVE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          messageId: message.id,
          sender: message.sender,
          text: message.text,
          hasFile: message.hasFile || false,
          fileName: message.fileName || null,
          imageUrl: message.imageUrl || null
        })
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const speak = (text: string) => {
    if (!isSpeechEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const russianVoice = voices.find(voice => voice.lang.startsWith('ru'));
    if (russianVoice) {
      utterance.voice = russianVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const exportConversation = () => {
    const text = messages.map(msg => {
      const time = msg.timestamp.toLocaleString('ru-RU');
      const sender = msg.sender === 'user' ? 'Вы' : 'Ванёк';
      return `[${time}] ${sender}: ${msg.text}`;
    }).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `диалог-${new Date().toLocaleDateString('ru-RU')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Экспорт завершён',
      description: 'Диалог сохранён в файл',
    });
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера не поддерживается в этом браузере');
      }

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
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            setIsCameraOn(true);
            toast({
              title: 'Камера включена',
              description: 'Теперь я вижу тебя!',
            });
          } catch (e) {
            console.error('Ошибка воспроизведения:', e);
          }
        };
      }
    } catch (error: any) {
      console.error('Ошибка камеры:', error);
      setIsCameraOn(false);
      
      let errorMsg = 'Не удалось получить доступ к камере';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Вы запретили доступ к камере. Разрешите в настройках браузера';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Камера не найдена на устройстве';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Камера уже используется другим приложением';
      }
      
      toast({
        title: 'Камера недоступна',
        description: errorMsg,
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
    await saveMessageToDB(userMessage);
    
    const messageText = inputValue.trim();
    const fileToSend = currentFile;
    setInputValue('');
    setCurrentFile(null);
    setIsLoading(true);

    try {
      const isImageRequest = messageText.toLowerCase().includes('нарисуй') || 
                            messageText.toLowerCase().includes('создай изображение') ||
                            messageText.toLowerCase().includes('сгенерируй картинку');

      const isCameraRequest = messageText.toLowerCase().includes('вид') && 
                             (messageText.toLowerCase().includes('меня') || 
                              messageText.toLowerCase().includes('камер'));

      if (isImageRequest) {
        const imagePrompt = messageText.replace(/нарисуй|создай изображение|сгенерируй картинку/gi, '').trim();
        
        const imageResponse = await fetch(BACKEND_IMAGE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: imagePrompt })
        });

        const imageData = await imageResponse.json();

        if (imageData.error) {
          throw new Error(imageData.error);
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Вот что я создал для тебя:',
          sender: 'ai',
          timestamp: new Date(),
          imageUrl: imageData.imageUrl
        };

        setMessages(prev => [...prev, aiMessage]);
        await saveMessageToDB(aiMessage);
        speak('Изображение готово!');
      } else {
        let contextImage = null;
        let fileInfo = '';
        let audioAnalysis = null;

        if (isCameraRequest && isCameraOn) {
          contextImage = captureFrame();
        } else if (fileToSend) {
          if (fileToSend.type.startsWith('image/')) {
            contextImage = fileToSend.data;
            fileInfo = `[Пользователь прикрепил изображение: ${fileToSend.name}] `;
          } else if (fileToSend.type.startsWith('audio/')) {
            // Анализируем аудио локально в браузере
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const audioData = await fetch(fileToSend.data);
              const arrayBuffer = await audioData.arrayBuffer();
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
              
              const duration = audioBuffer.duration;
              const sampleRate = audioBuffer.sampleRate;
              const channels = audioBuffer.numberOfChannels;
              
              // Анализ громкости
              const channelData = audioBuffer.getChannelData(0);
              let sum = 0;
              let max = 0;
              for (let i = 0; i < channelData.length; i++) {
                const abs = Math.abs(channelData[i]);
                sum += abs;
                if (abs > max) max = abs;
              }
              const avg = sum / channelData.length;
              
              audioAnalysis = {
                duration: Math.round(duration * 100) / 100,
                sampleRate: sampleRate,
                channels: channels === 2 ? 'stereo' : 'mono',
                peakLevel: Math.round(max * 100),
                avgLevel: Math.round(avg * 100),
                fileName: fileToSend.name,
                fileSize: Math.round(arrayBuffer.byteLength / 1024)
              };
              
              fileInfo = `[Пользователь прикрепил аудио: ${fileToSend.name}, проанализировано] `;
            } catch (e) {
              fileInfo = `[Пользователь прикрепил аудио: ${fileToSend.name}, анализ не удался] `;
            }
          } else {
            fileInfo = `[Пользователь прикрепил файл: ${fileToSend.name}, тип: ${fileToSend.type}] `;
          }
        }

        const fullMessage = fileInfo + (messageText || 'Что ты можешь сказать об этом файле?');

        const chatResponse = await fetch(BACKEND_CHAT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullMessage,
            image: contextImage,
            audioAnalysis: audioAnalysis,
            history: messages.slice(-10).map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            }))
          })
        });

        const chatData = await chatResponse.json();

        if (chatData.error) {
          throw new Error(chatData.error);
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: chatData.response,
          sender: 'ai',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        await saveMessageToDB(aiMessage);
        speak(chatData.response);
      }
    } catch (error: any) {
      console.error('Ошибка:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Ошибка: ${error.message || 'Не удалось получить ответ'}`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessageToDB(errorMessage);
      
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось получить ответ',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCurrentFile({
        data: result,
        type: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCurrentFile({
        data: result,
        type: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const clearChat = () => {
    setMessages([]);
    sessionIdRef.current = Date.now().toString() + Math.random().toString(36).substring(7);
    loadMessagesFromDB();
    toast({
      title: 'История очищена',
      description: 'Начат новый диалог',
    });
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    toast({
      title: isVoiceMode ? 'Голосовой режим выключен' : 'Голосовой режим включён',
      description: isVoiceMode ? 'Возвращаемся к тексту' : 'Теперь можно общаться голосом',
    });
  };

  const toggleSpeech = () => {
    setIsSpeechEnabled(!isSpeechEnabled);
    if (isSpeechEnabled) {
      window.speechSynthesis?.cancel();
    }
    toast({
      title: isSpeechEnabled ? 'Озвучка выключена' : 'Озвучка включена',
      description: isSpeechEnabled ? 'Ответы больше не озвучиваются' : 'Ответы будут озвучиваться',
    });
  };

  return {
    videoRef,
    fileInputRef,
    canvasRef,
    messages,
    inputValue,
    setInputValue,
    isVoiceMode,
    isRecording,
    isCameraOn,
    isLoading,
    isDragging,
    currentFile,
    isAiReady,
    isSpeechEnabled,
    handleSendMessage,
    handleFileSelect,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    exportConversation,
    toggleCamera,
    toggleVoiceMode,
    toggleSpeech,
    clearChat,
    removeFile: () => setCurrentFile(null)
  };
};