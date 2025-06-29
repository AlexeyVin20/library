'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Smartphone, Bell, BookOpen, Clock, Heart } from 'lucide-react'
import { UserSettings } from '@/hooks/use-settings'

interface NotificationSettingsProps {
  settings: UserSettings
  onNotificationChange: (type: 'email' | 'push', setting: keyof UserSettings['notifications']['email'], value: boolean) => void
}

export function NotificationSettings({ settings, onNotificationChange }: NotificationSettingsProps) {
  const notificationTypes = [
    {
      key: 'newBooks' as const,
      title: 'Новые книги',
      description: 'Уведомления о поступлении новых книг в библиотеку',
      icon: BookOpen
    },
    {
      key: 'returnReminders' as const,
      title: 'Напоминания о возврате',
      description: 'Напоминания о необходимости вернуть взятые книги',
      icon: Clock
    },
    {
      key: 'recommendations' as const,
      title: 'Рекомендации',
      description: 'Персональные рекомендации книг на основе ваших предпочтений',
      icon: Heart
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Email уведомления */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email уведомления
            </CardTitle>
            <CardDescription>
              Настройте получение уведомлений на электронную почту
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map(({ key, title, description, icon: Icon }) => (
              <div key={`email-${key}`} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`email-${key}`} className="text-sm font-medium">
                      {title}
                    </Label>
                    <Switch
                      id={`email-${key}`}
                      checked={settings.notifications.email[key]}
                      onCheckedChange={(checked: boolean) => onNotificationChange('email', key, checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Push уведомления */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Push уведомления
            </CardTitle>
            <CardDescription>
              Настройте получение push-уведомлений в браузере
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map(({ key, title, description, icon: Icon }) => (
              <div key={`push-${key}`} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`push-${key}`} className="text-sm font-medium">
                      {title}
                    </Label>
                    <Switch
                      id={`push-${key}`}
                      checked={settings.notifications.push[key]}
                      onCheckedChange={(checked: boolean) => onNotificationChange('push', key, checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Глобальное управление уведомлениями */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Быстрое управление
          </CardTitle>
          <CardDescription>
            Управление всеми типами уведомлений одновременно
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Все Email</div>
                <div className="text-sm text-muted-foreground">
                  Включить/выключить все email уведомления
                </div>
              </div>
              <Switch
                checked={Object.values(settings.notifications.email).some(Boolean)}
                onCheckedChange={(checked: boolean) => {
                  notificationTypes.forEach(({ key }) => {
                    onNotificationChange('email', key, checked)
                  })
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Все Push</div>
                <div className="text-sm text-muted-foreground">
                  Включить/выключить все push уведомления
                </div>
              </div>
              <Switch
                checked={Object.values(settings.notifications.push).some(Boolean)}
                onCheckedChange={(checked: boolean) => {
                  notificationTypes.forEach(({ key }) => {
                    onNotificationChange('push', key, checked)
                  })
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 