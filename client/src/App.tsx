import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, BookmarkPlus, Image, ExternalLink, Tag, Clock, Edit, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { ReferenceForm } from '@/components/ReferenceForm';
import { ReferenceCard } from '@/components/ReferenceCard';
import { ReferenceDetail } from '@/components/ReferenceDetail';
import { SearchBar } from '@/components/SearchBar';
import type { Reference, ReferenceWithScreenshots, CreateReferenceInput } from '../../server/src/schema';

function App() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedReference, setSelectedReference] = useState<ReferenceWithScreenshots | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Load references
  const loadReferences = useCallback(async () => {
    try {
      const result = await trpc.getReferences.query();
      setReferences(result);
    } catch (error) {
      console.error('Failed to load references:', error);
    }
  }, []);

  // Load available tags
  const loadTags = useCallback(async () => {
    try {
      const tags = await trpc.getAllTags.query();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  useEffect(() => {
    loadReferences();
    loadTags();
  }, [loadReferences, loadTags]);

  // Create new reference
  const handleCreateReference = async (data: CreateReferenceInput) => {
    setIsLoading(true);
    try {
      const newReference = await trpc.createReference.mutate(data);
      setReferences((prev: Reference[]) => [newReference, ...prev]);
      setShowCreateDialog(false);
      loadTags(); // Reload tags in case new ones were added
    } catch (error) {
      console.error('Failed to create reference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // View reference details
  const handleViewReference = async (id: number) => {
    try {
      const reference = await trpc.getReferenceById.query({ id });
      if (reference) {
        setSelectedReference(reference);
        setShowDetailDialog(true);
      }
    } catch (error) {
      console.error('Failed to load reference details:', error);
    }
  };

  // Delete reference
  const handleDeleteReference = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reference?')) return;
    
    try {
      await trpc.deleteReference.mutate({ id });
      setReferences((prev: Reference[]) => prev.filter(ref => ref.id !== id));
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Failed to delete reference:', error);
    }
  };

  // Filter references based on search and tags
  const filteredReferences = references.filter((reference: Reference) => {
    const matchesSearch = !searchQuery || 
      reference.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reference.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reference.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => reference.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <BookmarkPlus className="h-10 w-10 text-indigo-600" />
            UI Reference Manager
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Save, organize, and explore UI references with screenshots and detailed notes 🎨
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <SearchBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              allTags={allTags}
            />
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reference
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BookmarkPlus className="h-5 w-5 text-indigo-600" />
                    Create New UI Reference
                  </DialogTitle>
                  <DialogDescription>
                    Save a new UI reference with optional URL, screenshots, and notes
                  </DialogDescription>
                </DialogHeader>
                <ReferenceForm 
                  onSubmit={handleCreateReference}
                  isLoading={isLoading}
                  availableTags={allTags}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  "{searchQuery}"
                </Badge>
              )}
              {selectedTags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="flex items-center p-4">
              <BookmarkPlus className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{references.length}</p>
                <p className="text-sm text-gray-600">Total References</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="flex items-center p-4">
              <Tag className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{allTags.length}</p>
                <p className="text-sm text-gray-600">Unique Tags</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="flex items-center p-4">
              <ExternalLink className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {references.filter((ref: Reference) => ref.url).length}
                </p>
                <p className="text-sm text-gray-600">With URLs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* References Grid */}
        <div className="space-y-4">
          {filteredReferences.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="text-center p-12">
                {references.length === 0 ? (
                  <>
                    <BookmarkPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No references yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Start building your UI reference library by adding your first reference!
                    </p>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Reference
                    </Button>
                  </>
                ) : (
                  <>
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search query or selected tags
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReferences.map((reference: Reference) => (
                <ReferenceCard
                  key={reference.id}
                  reference={reference}
                  onView={() => handleViewReference(reference.id)}
                  onDelete={() => handleDeleteReference(reference.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reference Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedReference && (
              <ReferenceDetail 
                reference={selectedReference}
                onClose={() => setShowDetailDialog(false)}
                onDelete={() => handleDeleteReference(selectedReference.id)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;