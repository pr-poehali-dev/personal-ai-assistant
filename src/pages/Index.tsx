import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatLogic } from '@/hooks/useChatLogic';

const Index = () => {
  const navigate = useNavigate();
  
  const {
    videoRef,
    fileInputRef,
    canvasRef,
    messages,
    inputValue,
    setInputValue,
    isVoiceMode,
    isCameraOn,
    isLoading,
    isDragging,
    currentFile,
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
    removeFile
  } = useChatLogic();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b">
          <ChatHeader
            isCameraOn={isCameraOn}
            isVoiceMode={isVoiceMode}
            isSpeechEnabled={isSpeechEnabled}
            toggleCamera={toggleCamera}
            toggleVoiceMode={toggleVoiceMode}
            toggleSpeech={toggleSpeech}
            exportConversation={exportConversation}
            clearChat={clearChat}
          />
        </div>

        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          videoRef={videoRef}
          isCameraOn={isCameraOn}
          isListening={isListening}
        />

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          currentFile={currentFile}
          isDragging={isDragging}
          onSend={handleSendMessage}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeFile}
          fileInputRef={fileInputRef}
        />
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Index;