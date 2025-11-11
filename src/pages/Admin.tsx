import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface DialogHistory {
  id: string;
  date: Date;
  messages: number;
  preview: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const dialogHistory: DialogHistory[] = [
    {
      id: '1',
      date: new Date('2025-11-11T10:30:00'),
      messages: 15,
      preview: 'Создание изображения с космическим пейзажем...'
    },
    {
      id: '2',
      date: new Date('2025-11-10T15:45:00'),
      messages: 8,
      preview: 'Анализ документа по машинному обучению...'
    },
    {
      id: '3',
      date: new Date('2025-11-09T09:20:00'),
      messages: 23,
      preview: 'Разработка веб-приложения на React...'
    },
    {
      id: '4',
      date: new Date('2025-11-08T18:15:00'),
      messages: 12,
      preview: 'Поиск бесплатного софта для видеомонтажа...'
    }
  ];

  const trainingStats = {
    totalSessions: 156,
    successRate: 94.5,
    averageResponseTime: 1.2,
    knowledgeBase: 2847
  };

  const filteredDialogs = dialogHistory.filter(dialog =>
    dialog.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Панель управления
              </h1>
              <p className="text-muted-foreground mt-1">Управление и мониторинг ИИ-помощника</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Система активна
          </Badge>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="history" className="gap-2">
              <Icon name="MessageSquare" size={16} />
              История
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <Icon name="Brain" size={16} />
              Обучение
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Icon name="BarChart3" size={16} />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по диалогам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Icon name="Download" size={16} />
                Экспорт
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredDialogs.map((dialog) => (
                <Card key={dialog.id} className="p-6 hover:bg-accent/50 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon name="MessagesSquare" size={20} className="text-primary" />
                        <span className="font-semibold">Диалог #{dialog.id}</span>
                        <Badge variant="secondary">{dialog.messages} сообщений</Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{dialog.preview}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Calendar" size={14} />
                        {dialog.date.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        <span>•</span>
                        <Icon name="Clock" size={14} />
                        {dialog.date.toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="Eye" size={16} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="training" className="space-y-4 animate-fade-in">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Icon name="GraduationCap" size={24} className="text-primary" />
                <h2 className="text-2xl font-bold">Обучение модели</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Загрузить новые данные</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Icon name="Upload" size={32} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Перетащите файлы сюда или нажмите для выбора</p>
                    <p className="text-xs text-muted-foreground mt-1">Поддерживаются: PDF, TXT, DOCX, JSON</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">История обучения</label>
                  <div className="space-y-2">
                    <Card className="p-4 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Icon name="CheckCircle2" size={20} className="text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">Обучение завершено</p>
                            <p className="text-xs text-muted-foreground">11.11.2025, 14:30</p>
                          </div>
                        </div>
                        <Badge variant="outline">+250 записей</Badge>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="MessageSquare" size={20} className="text-primary" />
                  <Badge variant="secondary">+12%</Badge>
                </div>
                <p className="text-3xl font-bold">{trainingStats.totalSessions}</p>
                <p className="text-sm text-muted-foreground mt-1">Всего диалогов</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="TrendingUp" size={20} className="text-green-500" />
                  <Badge variant="secondary">+5%</Badge>
                </div>
                <p className="text-3xl font-bold">{trainingStats.successRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Успешность</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="Zap" size={20} className="text-yellow-500" />
                  <Badge variant="secondary">-0.2s</Badge>
                </div>
                <p className="text-3xl font-bold">{trainingStats.averageResponseTime}s</p>
                <p className="text-sm text-muted-foreground mt-1">Среднее время</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="Database" size={20} className="text-blue-500" />
                  <Badge variant="secondary">+320</Badge>
                </div>
                <p className="text-3xl font-bold">{trainingStats.knowledgeBase}</p>
                <p className="text-sm text-muted-foreground mt-1">База знаний</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Активность по дням</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[45, 62, 38, 71, 55, 82, 67].map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary rounded-t-lg hover:bg-primary/80 transition-colors cursor-pointer"
                      style={{ height: `${value}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
