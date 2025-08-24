import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Calendar, Tag, FileText, Image, Lightbulb, Trash2, Edit } from 'lucide-react';
import type { ReferenceWithScreenshots } from '../../../server/src/schema';

interface ReferenceDetailProps {
  reference: ReferenceWithScreenshots;
  onClose: () => void;
  onDelete: () => void;
}

export function ReferenceDetail({ reference, onClose, onDelete }: ReferenceDetailProps) {
  const handleExternalLink = () => {
    if (reference.url) {
      window.open(reference.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              {reference.title}
            </DialogTitle>
            {reference.url && (
              <button
                onClick={handleExternalLink}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-sm underline">{new URL(reference.url).hostname}</span>
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Design Notes
          </TabsTrigger>
          <TabsTrigger value="screenshots" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Screenshots ({reference.screenshots.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Description */}
          {reference.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {reference.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {reference.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-600" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {reference.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm font-medium">
                  {reference.created_at.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last updated:</span>
                <span className="text-sm font-medium">
                  {reference.updated_at.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Screenshots:</span>
                <span className="text-sm font-medium">
                  {reference.screenshots.length} attached
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {reference.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-indigo-600" />
                  Design Notes & Observations
                </CardTitle>
                <CardDescription>
                  Detailed analysis of design patterns, interactions, and implementation details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {reference.notes}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No design notes yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Design notes help capture detailed observations about UI patterns, interactions, and implementation details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="screenshots" className="space-y-4">
          {reference.screenshots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reference.screenshots.map((screenshot) => (
                <Card key={screenshot.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {screenshot.original_filename}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {(screenshot.file_size / 1024).toFixed(1)} KB • {screenshot.mime_type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Note: In a real implementation, you'd display the actual image */}
                    <div className="bg-gray-100 aspect-video flex items-center justify-center">
                      <div className="text-center">
                        <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Screenshot Preview</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {screenshot.alt_text || 'No alt text provided'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No screenshots yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Screenshots help visualize the UI elements and provide context for your reference notes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}