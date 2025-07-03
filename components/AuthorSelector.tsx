'use client';
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/Combobox";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Author {
  id: string;
  fullName: string;
}

interface AuthorSelectorProps {
  selectedAuthors: Author[];
  availableAuthors: Author[];
  onAuthorChange: (authorIds: string[]) => void;
  onAddNewAuthor: (name: string) => void;
  isLoading: boolean;
}

const AuthorSelector: React.FC<AuthorSelectorProps> = ({
  selectedAuthors,
  availableAuthors,
  onAuthorChange,
  onAddNewAuthor,
  isLoading,
}) => {
  const [newAuthorName, setNewAuthorName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const authorOptions = availableAuthors
    .filter(author => !selectedAuthors.some(selected => selected.id === author.id))
    .map(author => ({
      label: author.fullName,
      value: author.id,
      key: author.id // Ensure each option has a unique key
    }));

  const handleAddAuthorClick = () => {
    const trimmedName = newAuthorName.trim();
    if (!trimmedName) {
      setInputError("Имя автора не может быть пустым");
      return;
    }
    // Проверка на дубликаты
    const isDuplicate = availableAuthors.some(
      (author) => author.fullName.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setInputError("Такой автор уже существует");
      return;
    }
    setInputError(null);
    onAddNewAuthor(trimmedName);
    setNewAuthorName("");
    setIsAdding(false);
  };

  const handleRemoveAuthor = (authorId: string) => {
    const updatedAuthorIds = selectedAuthors
      .filter((author) => author.id !== authorId)
      .map((author) => author.id);
    onAuthorChange(updatedAuthorIds);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-medium">Авторы книги</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium">Выбрать существующих авторов</h3>
          </div>

          <Combobox
            options={authorOptions}
            value={selectedAuthors.map((a) => a.id)}
            onChange={onAuthorChange}
            multiple
            placeholder="Поиск авторов..."
            className="w-full"
            disabled={isLoading}
            renderOption={(option) => (
              <div className="flex items-center">
                <span>{option.label}</span>
              </div>
            )}
          />
        </div>

        {selectedAuthors.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Выбранные авторы:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedAuthors.map(author => (
                <Badge 
                  key={author.id} // Add unique key here
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {author.fullName}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAuthor(author.id)}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-gray-500" />
            <h3 className="font-medium">Добавить нового автора</h3>
          </div>

          {isAdding ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Введите имя автора"
                  value={newAuthorName}
                  onChange={(e) => {
                    setNewAuthorName(e.target.value);
                    setInputError(null);
                  }}
                  className="flex-1"
                  disabled={isLoading}
                  error={inputError || undefined}
                />
                <Button onClick={handleAddAuthorClick} className="whitespace-nowrap" disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Добавить"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setInputError(null);
                  }}
                  className="px-3"
                  disabled={isLoading}
                >
                  Отмена
                </Button>
              </div>
              {inputError && <p className="text-sm text-red-500">{inputError}</p>}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setIsAdding(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" /> Добавить нового автора
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorSelector;
