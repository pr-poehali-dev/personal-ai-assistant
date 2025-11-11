import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface CameraPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const CameraPermissionDialog = ({ isOpen, onClose, onRetry }: CameraPermissionDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Icon name="Video" className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Разрешение на камеру и микрофон</h3>
            <p className="text-sm text-muted-foreground">
              Для работы с камерой нужно разрешить доступ в браузере
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-muted p-4 rounded-lg">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-sm">Нажми кнопку камеры 📹</p>
              <p className="text-xs text-muted-foreground mt-1">
                Браузер покажет запрос разрешения сверху или в адресной строке
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-sm">Нажми "Разрешить" или "Allow"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Разреши доступ к камере И микрофону (оба важны!)
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-sm">Готово! 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">
                Камера включится и я увижу и услышу тебя
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex gap-2">
            <Icon name="AlertCircle" className="text-amber-600 flex-shrink-0" size={16} />
            <div>
              <p className="text-xs font-medium text-amber-900">Если не видишь запрос:</p>
              <ul className="text-xs text-amber-800 mt-1 space-y-1 ml-4 list-disc">
                <li>Проверь адресную строку — там может быть иконка 🔒 или камеры</li>
                <li>Нажми на неё и выбери "Разрешить"</li>
                <li>Перезагрузи страницу и попробуй снова</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onRetry} className="flex-1">
            <Icon name="Video" size={16} className="mr-2" />
            Попробовать снова
          </Button>
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </Card>
    </div>
  );
};