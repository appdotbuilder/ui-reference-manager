import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Link as LinkIcon, FileText, Tag, Lightbulb } from 'lucide-react';
import type { CreateReferenceInput } from '../../../server/src/schema';

interface ReferenceFormProps {
  onSubmit: (data: CreateReferenceInput) => Promise<void>;
  isLoading?: boolean;
  availableTags?: string[];
}

export function ReferenceForm({ onSubmit, isLoading = false, availableTags = [] }: ReferenceFormProps) {
  const [formData, setFormData] = useState<CreateReferenceInput>({
    title: '',
    url: null,
    description: null,
    notes: null,
    tags: []
  });

  const [newTag, setNewTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      title: '',
      url: null,
      description: null,
      notes: null,
      tags: []
    });
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev: CreateReferenceInput) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev: CreateReferenceInput) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addExistingTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev: CreateReferenceInput) => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateReferenceInput) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Name of the UI reference or page"
          required
          className="w-full"
        />
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url" className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4" />
          URL (optional)
        </Label>
        <Input
          id="url"
          type="url"
          value={formData.url || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateReferenceInput) => ({
              ...prev,
              url: e.target.value || null
            }))
          }
          placeholder="https://example.com"
          className="w-full"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Description (optional)
        </Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateReferenceInput) => ({
              ...prev,
              description: e.target.value || null
            }))
          }
          placeholder="Brief description of what makes this UI interesting or noteworthy"
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Design Notes (optional)
        </Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateReferenceInput) => ({
              ...prev,
              notes: e.target.value || null
            }))
          }
          placeholder="Detailed notes about design patterns, interactions, or implementation details..."
          className="min-h-[120px] resize-none"
        />
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </Label>
        
        {/* Current Tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add New Tag */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a tag (e.g., navigation, modal, form)"
            className="flex-1"
          />
          <Button type="button" onClick={addTag} disabled={!newTag.trim()} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing Tags Suggestions */}
        {availableTags.length > 0 && (
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <p className="text-sm text-gray-600 mb-2">Quick add from existing tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter((tag: string) => !formData.tags.includes(tag))
                  .slice(0, 10)
                  .map((tag: string) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addExistingTag(tag)}
                      className="text-xs bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded px-2 py-1 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button 
          type="submit" 
          disabled={isLoading || !formData.title.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
        >
          {isLoading ? 'Creating...' : 'Create Reference'}
        </Button>
      </div>
    </form>
  );
}