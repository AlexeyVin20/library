'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'

interface GenreSelectorProps {
  selectedGenres: string[]
  onGenresChange: (genres: string[]) => void
}

// Популярные жанры для быстрого выбора
const POPULAR_GENRES = [
  'Фантастика',
  'Детектив',
  'Романтика',
  'Триллер',
  'Фэнтези',
  'Биография',
  'История',
  'Психология',
  'Программирование',
  'Философия',
  'Поэзия',
  'Драма',
  'Комедия',
  'Приключения',
  'Ужасы',
  'Научная фантастика',
  'Бизнес',
  'Самопомощь',
  'Кулинария',
  'Путешествия'
]

export function GenreSelector({ selectedGenres, onGenresChange }: GenreSelectorProps) {
  const [customGenre, setCustomGenre] = useState('')

  const addGenre = (genre: string) => {
    if (genre && !selectedGenres.includes(genre)) {
      onGenresChange([...selectedGenres, genre])
    }
  }

  const removeGenre = (genre: string) => {
    onGenresChange(selectedGenres.filter(g => g !== genre))
  }

  const addCustomGenre = () => {
    if (customGenre.trim()) {
      addGenre(customGenre.trim())
      setCustomGenre('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomGenre()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-3">Выбранные жанры</h4>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/30">
          {selectedGenres.length === 0 ? (
            <span className="text-sm text-muted-foreground">Жанры не выбраны</span>
          ) : (
            selectedGenres.map((genre) => (
              <Badge key={genre} variant="secondary" className="gap-1">
                {genre}
                <button
                  onClick={() => removeGenre(genre)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Популярные жанры</h4>
        <div className="flex flex-wrap gap-2">
          {POPULAR_GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre)
            return (
              <Button
                key={genre}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => isSelected ? removeGenre(genre) : addGenre(genre)}
                className="text-xs"
              >
                {genre}
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Добавить свой жанр</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Введите название жанра"
            value={customGenre}
            onChange={(e) => setCustomGenre(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addCustomGenre} size="sm" disabled={!customGenre.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 