'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Rubricator {
  id: number;
  name: string;
  description: string | null;
}

interface RubricatorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
}

const RubricatorForm = ({
  rubricator,
  onSave,
  onCancel,
  isSaving,
}: {
  rubricator: Partial<Rubricator>;
  onSave: (rubricator: Omit<Rubricator, 'id'> & { id?: number }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  const [name, setName] = useState(rubricator.name || '');
  const [description, setDescription] = useState(rubricator.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Ошибка", description: "Название не может быть пустым", variant: "destructive" });
      return;
    }
    onSave({ id: rubricator.id, name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Название</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание</label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Отмена</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </DialogFooter>
    </form>
  );
};

const RubricatorSelectorModal = ({ isOpen, onClose, onSelect }: RubricatorSelectorModalProps) => {
  const [rubricators, setRubricators] = useState<Rubricator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRubricator, setEditingRubricator] = useState<Partial<Rubricator> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/Rubricator`;

  const fetchRubricators = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Не удалось загрузить рубрикаторы');
      const data = await response.json();
      setRubricators(data);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isOpen) {
      fetchRubricators();
    }
  }, [isOpen, fetchRubricators]);

  const handleCreate = () => {
    setEditingRubricator({});
    setIsFormOpen(true);
  };

  const handleEdit = (rubricator: Rubricator) => {
    setEditingRubricator(rubricator);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот рубрикатор?")) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Не удалось удалить рубрикатор');
      toast({ title: "Успех", description: "Рубрикатор удален" });
      fetchRubricators();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async (data: Omit<Rubricator, 'id'> & { id?: number }) => {
    setIsSaving(true);
    const isEditing = data && data.id;
    const url = isEditing ? `${API_URL}/${data.id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Не удалось сохранить рубрикатор: ${errorText}`);
      }
      toast({ title: "Успех", description: "Рубрикатор сохранен" });
      setIsFormOpen(false);
      setEditingRubricator(null);
      fetchRubricators();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = (name: string) => {
    onSelect(name);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Выбор рубрикатора</DialogTitle>
          <DialogDescription>
            Выберите рубрикатор из списка или создайте новый.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mb-4">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Создать
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="w-[250px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubricators.map((rubricator) => (
                  <TableRow key={rubricator.id}>
                    <TableCell className="font-medium">{rubricator.name}</TableCell>
                    <TableCell>{rubricator.description}</TableCell>
                    <TableCell className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleSelect(rubricator.name)}>
                        Выбрать
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(rubricator)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rubricator.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingRubricator(null);
        }
        setIsFormOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRubricator && editingRubricator.id ? 'Изменить' : 'Создать'} рубрикатор</DialogTitle>
          </DialogHeader>
          {editingRubricator && (
            <RubricatorForm
              rubricator={editingRubricator}
              onSave={handleSave}
              onCancel={() => setIsFormOpen(false)}
              isSaving={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default RubricatorSelectorModal; 