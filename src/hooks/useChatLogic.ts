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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

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
          text: 'Привет! Я Ванёк — персональный AI-помощник, которого создал для тебя Иван Верещагин.\n\n✅ Что умею:\n• Общаться и помогать по любым вопросам\n• Анализировать изображения и фотографии\n• Видеть через камеру и слышать тебя в реальном времени\n• Автоматически отвечать на твои вопросы через камеру (просто говори!)\n• Анализировать аудио: качество записи, баланс частот, тип музыки\n• Распознавать речь и вокал в аудиофайлах\n• Генерировать картинки (напиши "нарисуй [описание]")\n\n❌ Чего НЕ умею:\n• Определять исполнителя или название песни\n• Анализировать видеофайлы напрямую (но можешь сделать скриншот!)\n• Предсказывать будущее\n• Управлять устройствами\n• Помнить прошлые беседы после закрытия\n\n💡 Включи камеру - увижу и услышу тебя в реальном времени!',
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

      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        throw new Error('Камера работает только на HTTPS');
      }

      console.log('Запрашиваю доступ к камере...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });
      
      console.log('✅ Доступ получен!', stream.getTracks());
      audioStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
            console.log('✅ Видео запущено');
            setIsCameraOn(true);
            startVoiceRecognition();
            toast({
              title: '📹 Камера включена',
              description: 'Видео и аудио готовы!',
            });
          } catch (e) {
            console.error('Ошибка воспроизведения:', e);
          }
        };
      }
    } catch (error: any) {
      console.error('❌ ПОЛНАЯ ошибка камеры:', error);
      console.error('Тип ошибки:', error.name);
      console.error('Сообщение:', error.message);
      setIsCameraOn(false);
      
      let errorMsg = error.message || 'Не удалось включить камеру';
      
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Нажмите "Разрешить" в браузере для доступа к камере';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Камера не найдена на устройстве';
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Камера используется другим приложением';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast({
        title: '❌ Камера недоступна',
        description: errorMsg,
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    stopVoiceRecognition();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
      toast({
        title: 'Камера выключена',
      });
    } else {
      startCamera();
    }
  };

  const startVoiceRecognition = () => {
    try {
      console.log('🎤 Инициализация распознавания речи...');
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.log('❌ Speech Recognition не поддерживается');
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        console.log('✅ Распознавание речи запущено');
      };
      
      recognition.onresult = async (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        console.log('Распознано:', transcript);
        
        if (transcript && transcript.trim().length > 3) {
          setInputValue(transcript);
          
          setTimeout(async () => {
            const frame = captureFrame();
            if (frame) {
              const userMessage: Message = {
                id: Date.now().toString(),
                text: transcript,
                sender: 'user',
                timestamp: new Date()
              };
              
              setMessages(prev => [...prev, userMessage]);
              await saveMessageToDB(userMessage);
              setInputValue('');
              setIsLoading(true);
              
              try {
                const chatResponse = await fetch(BACKEND_CHAT, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: transcript,
                    image: frame,
                    history: messages.slice(-10).map(msg => ({
                      role: msg.sender === 'user' ? 'user' : 'assistant',
                      content: msg.text
                    }))
                  })
                });
                
                const chatData = await chatResponse.json();
                
                if (!chatData.error) {
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
              } catch (error) {
                console.error('Ошибка отправки:', error);
              } finally {
                setIsLoading(false);
              }
            }
          }, 500);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.log('Ошибка распознавания:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          setTimeout(() => {
            if (isCameraOn && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Распознавание уже запущено');
              }
            }
          }, 1000);
        }
      };
      
      recognition.onend = () => {
        console.log('Распознавание остановлено');
        setIsListening(false);
        if (isCameraOn) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Не удалось перезапустить распознавание');
            }
          }, 500);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Ошибка запуска распознавания:', error);
    }
  };
  
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
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

        if (isCameraOn) {
          contextImage = captureFrame();
          if (contextImage && !fileToSend) {
            fileInfo = '[Видео с камеры] ';
          }
        }
        
        if (fileToSend) {
          if (fileToSend.type.startsWith('image/')) {
            console.log('🖼️ Обрабатываю изображение');
            contextImage = fileToSend.data;
            fileInfo = `[Пользователь прикрепил изображение: ${fileToSend.name}] `;
          } else if (fileToSend.type.startsWith('audio/')) {
            console.log('🎵 Обрабатываю аудио');

            // Полный анализ аудио: технические параметры + распознавание речи
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
              
              // Анализ музыкальных характеристик (частотный анализ)
              const analyser = audioContext.createAnalyser();
              analyser.fftSize = 2048;
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(analyser);
              
              const frequencyData = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(frequencyData);
              
              // Определяем преобладающие частоты
              let bassEnergy = 0;
              let midEnergy = 0;
              let trebleEnergy = 0;
              
              for (let i = 0; i < frequencyData.length; i++) {
                if (i < frequencyData.length / 4) bassEnergy += frequencyData[i];
                else if (i < frequencyData.length / 2) midEnergy += frequencyData[i];
                else trebleEnergy += frequencyData[i];
              }
              
              const totalEnergy = bassEnergy + midEnergy + trebleEnergy;
              
              audioAnalysis = {
                duration: Math.round(duration * 100) / 100,
                sampleRate: sampleRate,
                channels: channels === 2 ? 'stereo' : 'mono',
                peakLevel: Math.round(max * 100),
                avgLevel: Math.round(avg * 100),
                fileName: fileToSend.name,
                fileSize: Math.round(arrayBuffer.byteLength / 1024),
                // Музыкальные характеристики
                bassLevel: totalEnergy > 0 ? Math.round((bassEnergy / totalEnergy) * 100) : 0,
                midLevel: totalEnergy > 0 ? Math.round((midEnergy / totalEnergy) * 100) : 0,
                trebleLevel: totalEnergy > 0 ? Math.round((trebleEnergy / totalEnergy) * 100) : 0,
                musicType: bassEnergy > midEnergy && bassEnergy > trebleEnergy ? 'басс-тяжелая (электронная/хип-хоп)' :
                          midEnergy > bassEnergy && midEnergy > trebleEnergy ? 'средние частоты (вокал/рок)' :
                          'высокие частоты (поп/классика)'
              };
              
              // Попытка распознавания речи через Web Speech API
              let transcription = '';
              try {
                // Создаём Audio элемент для воспроизведения
                const audio = new Audio(fileToSend.data);
                
                // Инициализируем Speech Recognition
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                  const recognition = new SpeechRecognition();
                  recognition.lang = 'ru-RU';
                  recognition.continuous = true;
                  recognition.interimResults = false;
                  recognition.maxAlternatives = 1;
                  
                  // Создаём MediaStreamDestination для захвата аудио
                  const dest = audioContext.createMediaStreamDestination();
                  const sourceNode = audioContext.createBufferSource();
                  sourceNode.buffer = audioBuffer;
                  sourceNode.connect(dest);
                  
                  // Пытаемся распознать через микрофонный API
                  await new Promise<void>((resolve) => {
                    let fullTranscript = '';
                    
                    recognition.onresult = (event: any) => {
                      for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                          fullTranscript += event.results[i][0].transcript + ' ';
                        }
                      }
                    };
                    
                    recognition.onend = () => {
                      transcription = fullTranscript.trim();
                      resolve();
                    };
                    
                    recognition.onerror = () => {
                      resolve();
                    };
                    
                    // Запускаем распознавание и воспроизведение
                    recognition.start();
                    sourceNode.start(0);
                    
                    // Останавливаем через 5 секунд или когда закончится аудио
                    setTimeout(() => {
                      recognition.stop();
                      sourceNode.stop();
                      resolve();
                    }, Math.min(duration * 1000, 5000));
                  });
                }
              } catch (speechError) {
                console.log('Speech recognition not available:', speechError);
              }
              
              if (transcription) {
                audioAnalysis.transcription = transcription;
                fileInfo = `[Пользователь прикрепил аудио: ${fileToSend.name}. Распознанный текст: "${transcription}"] `;
              } else {
                fileInfo = `[Пользователь прикрепил аудио: ${fileToSend.name}, проанализировано] `;
              }
              
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
    isListening,
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