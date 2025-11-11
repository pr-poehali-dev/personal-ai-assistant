import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ChatHeaderProps {
  isCameraOn: boolean;
  isVoiceMode: boolean;
  isSpeechEnabled: boolean;
  toggleCamera: () => void;
  toggleVoiceMode: () => void;
  toggleSpeech: () => void;
  exportConversation: () => void;
  clearChat: () => void;
}

export const ChatHeader = ({
  isCameraOn,
  isVoiceMode,
  isSpeechEnabled,
  toggleCamera,
  toggleVoiceMode,
  toggleSpeech,
  exportConversation,
  clearChat
}: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
          <Icon name="Bot" className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Ванёк</h2>
          <Badge variant="secondary" className="text-xs">
            <Icon name="Sparkles" size={12} className="mr-1" />
            GPT-4
          </Badge>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={isCameraOn ? "default" : "outline"}
          size="icon"
          onClick={toggleCamera}
          className={isCameraOn ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <Icon name={isCameraOn ? "Video" : "VideoOff"} size={18} />
        </Button>

        <Button
          variant={isVoiceMode ? "default" : "outline"}
          size="icon"
          onClick={toggleVoiceMode}
          className={isVoiceMode ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          <Icon name={isVoiceMode ? "Mic" : "MicOff"} size={18} />
        </Button>

        <Button
          variant={isSpeechEnabled ? "default" : "outline"}
          size="icon"
          onClick={toggleSpeech}
          className={isSpeechEnabled ? "bg-purple-600 hover:bg-purple-700" : ""}
        >
          <Icon name={isSpeechEnabled ? "Volume2" : "VolumeX"} size={18} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={exportConversation}
        >
          <Icon name="Download" size={18} />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={clearChat}
        >
          <Icon name="Trash2" size={18} />
        </Button>
      </div>
    </div>
  );
};
