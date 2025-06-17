'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Save, X, FileText, Copy } from 'lucide-react'

interface NotificationTemplate {
  id: string
  name: string
  title: string
  message: string
  type: string
  priority: string
  variables: string[]
  createdAt: string
  isActive: boolean
}

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'GeneralInfo',
    priority: 'Normal',
    variables: [] as string[]
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      // Пока что используем моковые данные, так как API для шаблонов еще может не быть
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Напоминание о возврате книги',
          title: 'Напоминание о возврате',
          message: 'Уважаемый {{userName}}, напоминаем что книга "{{bookTitle}}" должна быть возвращена {{dueDate}}',
          type: 'BookDueSoon',
          priority: 'Normal',
          variables: ['userName', 'bookTitle', 'dueDate'],
          createdAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: '2',
          name: 'Уведомление о просрочке',
          title: 'Просрочена книга',
          message: 'Книга "{{bookTitle}}" просрочена на {{overdueDays}} дней. Пожалуйста, верните её как можно скорее.',
          type: 'BookOverdue',
          priority: 'High',
          variables: ['bookTitle', 'overdueDays'],
          createdAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: '3',
          name: 'Уведомление о штрафе',
          title: 'Начислен штраф',
          message: 'За просрочку книги "{{bookTitle}}" начислен штраф в размере {{fineAmount}} руб.',
          type: 'FineAdded',
          priority: 'High',
          variables: ['bookTitle', 'fineAmount'],
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить шаблоны",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async () => {
    try {
      // Здесь будет API запрос для сохранения шаблона
      const newTemplate: NotificationTemplate = {
        id: Date.now().toString(),
        ...templateForm,
        createdAt: new Date().toISOString(),
        isActive: true
      }

      setTemplates([...templates, newTemplate])
      
      toast({
        title: "Успешно",
        description: "Шаблон создан"
      })
      
      resetForm()
      setShowCreateModal(false)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать шаблон",
        variant: "destructive"
      })
    }
  }

  const updateTemplate = async () => {
    if (!editingTemplate) return

    try {
      // Здесь будет API запрос для обновления шаблона
      const updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateForm }
          : t
      )
      
      setTemplates(updatedTemplates)
      
      toast({
        title: "Успешно",
        description: "Шаблон обновлен"
      })
      
      resetForm()
      setShowEditModal(false)
      setEditingTemplate(null)
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить шаблон",
        variant: "destructive"
      })
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      // Здесь будет API запрос для удаления шаблона
      setTemplates(templates.filter(t => t.id !== templateId))
      
      toast({
        title: "Успешно",
        description: "Шаблон удален"
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить шаблон",
        variant: "destructive"
      })
    }
  }

  const duplicateTemplate = async (template: NotificationTemplate) => {
    const duplicated: NotificationTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (копия)`,
      createdAt: new Date().toISOString()
    }
    
    setTemplates([...templates, duplicated])
    
    toast({
      title: "Успешно",
      description: "Шаблон скопирован"
    })
  }

  const resetForm = () => {
    setTemplateForm({
      name: '',
      title: '',
      message: '',
      type: 'GeneralInfo',
      priority: 'Normal',
      variables: []
    })
  }

  const openEditModal = (template: NotificationTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority,
      variables: template.variables
    })
    setShowEditModal(true)
  }

  const extractVariables = (message: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    let match
    
    while ((match = regex.exec(message)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }
    
    return variables
  }

  const handleMessageChange = (message: string) => {
    const variables = extractVariables(message)
    setTemplateForm({
      ...templateForm,
      message,
      variables
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'GeneralInfo': 'Общая информация',
      'BookDueSoon': 'Скоро возврат',
      'BookOverdue': 'Просрочка',
      'FineAdded': 'Штраф',
      'BookReturned': 'Возврат книги',
      'BookReserved': 'Резерв'
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Загрузка...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Шаблоны уведомлений</h1>
          <p className="text-muted-foreground">
            Создание и управление шаблонами для автоматических уведомлений
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать шаблон
        </Button>
      </div>

      {/* Список шаблонов */}
      <Card>
        <CardHeader>
          <CardTitle>Список шаблонов</CardTitle>
          <CardDescription>
            Всего шаблонов: {templates.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Переменные</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.title}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypeLabel(template.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        template.priority === 'Critical' ? 'destructive' :
                        template.priority === 'High' ? 'destructive' :
                        template.priority === 'Normal' ? 'default' : 'secondary'
                      }
                    >
                      {template.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Нет шаблонов для отображения
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно создания шаблона */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать шаблон уведомления</DialogTitle>
            <DialogDescription>
              Создайте новый шаблон для автоматических уведомлений
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название шаблона</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="Введите название"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Тип уведомления</Label>
                <Select 
                  value={templateForm.type} 
                  onValueChange={(value) => setTemplateForm({...templateForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GeneralInfo">Общая информация</SelectItem>
                    <SelectItem value="BookDueSoon">Скоро возврат</SelectItem>
                    <SelectItem value="BookOverdue">Просрочка</SelectItem>
                    <SelectItem value="FineAdded">Штраф</SelectItem>
                    <SelectItem value="BookReturned">Возврат книги</SelectItem>
                    <SelectItem value="BookReserved">Резерв</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок уведомления</Label>
                <Input
                  id="title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                  placeholder="Введите заголовок"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select 
                  value={templateForm.priority} 
                  onValueChange={(value) => setTemplateForm({...templateForm, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Низкий</SelectItem>
                    <SelectItem value="Normal">Обычный</SelectItem>
                    <SelectItem value="High">Высокий</SelectItem>
                    <SelectItem value="Critical">Критический</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Текст сообщения</Label>
              <Textarea
                id="message"
                value={templateForm.message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Введите текст сообщения. Используйте {{переменная}} для динамических значений"
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                Используйте синтаксис {"{{переменная}}"} для вставки динамических значений
              </p>
            </div>

            {templateForm.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Найденные переменные</Label>
                <div className="flex flex-wrap gap-2">
                  {templateForm.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                <X className="mr-2 h-4 w-4" />
                Отменить
              </Button>
              <Button 
                onClick={saveTemplate}
                disabled={!templateForm.name || !templateForm.title || !templateForm.message}
              >
                <Save className="mr-2 h-4 w-4" />
                Создать шаблон
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно редактирования шаблона */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать шаблон</DialogTitle>
            <DialogDescription>
              Изменение существующего шаблона уведомления
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Название шаблона</Label>
                <Input
                  id="edit-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="Введите название"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type">Тип уведомления</Label>
                <Select 
                  value={templateForm.type} 
                  onValueChange={(value) => setTemplateForm({...templateForm, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GeneralInfo">Общая информация</SelectItem>
                    <SelectItem value="BookDueSoon">Скоро возврат</SelectItem>
                    <SelectItem value="BookOverdue">Просрочка</SelectItem>
                    <SelectItem value="FineAdded">Штраф</SelectItem>
                    <SelectItem value="BookReturned">Возврат книги</SelectItem>
                    <SelectItem value="BookReserved">Резерв</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Заголовок уведомления</Label>
                <Input
                  id="edit-title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                  placeholder="Введите заголовок"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Приоритет</Label>
                <Select 
                  value={templateForm.priority} 
                  onValueChange={(value) => setTemplateForm({...templateForm, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Низкий</SelectItem>
                    <SelectItem value="Normal">Обычный</SelectItem>
                    <SelectItem value="High">Высокий</SelectItem>
                    <SelectItem value="Critical">Критический</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">Текст сообщения</Label>
              <Textarea
                id="edit-message"
                value={templateForm.message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Введите текст сообщения. Используйте {{переменная}} для динамических значений"
                rows={5}
              />
            </div>

            {templateForm.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Найденные переменные</Label>
                <div className="flex flex-wrap gap-2">
                  {templateForm.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                <X className="mr-2 h-4 w-4" />
                Отменить
              </Button>
              <Button 
                onClick={updateTemplate}
                disabled={!templateForm.name || !templateForm.title || !templateForm.message}
              >
                <Save className="mr-2 h-4 w-4" />
                Сохранить изменения
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}