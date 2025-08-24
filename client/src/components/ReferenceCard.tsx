import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Eye, Calendar, Tag, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import type { Reference } from '../../../server/src/schema';

interface ReferenceCardProps {
  reference: Reference;
  onView: () => void;
  onDelete: () => void;
}

export function ReferenceCard({ reference, onView, onDelete }: ReferenceCardProps) {
  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reference.url) {
      window.open(reference.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {reference.title}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {reference.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExternalLink}
                className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-600"
                title="Open URL"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
              title="Delete reference"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent onClick={onView} className="space-y-3">
        {/* Description */}
        {reference.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {reference.description}
          </p>
        )}

        {/* URL indicator */}
        {reference.url && (
          <div className="flex items-center gap-2 text-xs text-indigo-600">
            <LinkIcon className="h-3 w-3" />
            <span className="truncate">{new URL(reference.url).hostname}</span>
          </div>
        )}

        {/* Notes indicator */}
        {reference.notes && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="h-3 w-3" />
            <span>Has design notes</span>
          </div>
        )}

        {/* Tags */}
        {reference.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reference.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {reference.tags.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{reference.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{reference.created_at.toLocaleDateString()}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs hover:bg-indigo-100 hover:text-indigo-600"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}