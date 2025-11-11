import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  currentFile: { data: string; type: string; name: string } | null;
  isDragging: boolean;
  onSend: () => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ChatInput = ({
  inputValue,
  setInputValue,
  isLoading,
  currentFile,
  isDragging,
  onSend,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemoveFile,
  fileInputRef
}: ChatInputProps) => {
  return (
    <div 
      className={`p-4 border-t transition-colors ${isDragging ? 'bg-primary/10 border-primary' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="text-center py-8 mb-4 border-2 border-dashed border-primary rounded-lg bg-primary/5">
          <Icon name="Upload" size={48} className="mx-auto mb-2 text-primary" />
          <p className="text-lg font-medium">Отпустите файл для загрузки</p>
        </div>
      )}
      
      {currentFile && (
        <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Paperclip" size={16} />
            <span className="text-sm">{currentFile.name}</span>
            <Badge variant="secondary" className="text-xs">
              {currentFile.type.split('/')[0]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRemoveFile}
          >
            <Icon name="X" size={14} />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Спроси меня о чём угодно, попроси нарисовать или загрузи файл..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          className="min-h-[60px] max-h-[400px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={onSend}
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
          disabled={isLoading || (!inputValue.trim() && !currentFile)}
        >
          <Icon name="Send" size={24} />
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          className="h-[60px] w-[60px] shrink-0"
          disabled={isLoading}
        >
          <Icon name="Paperclip" size={24} />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv,.m4v,.mp3,.wav,.ogg,.m4a,.flac,.aac,.pdf,.doc,.docx,.txt"
          onChange={onFileSelect}
        />
      </div>
    </div>
  );
};