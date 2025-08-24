import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Tag, X, Filter } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

export function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  selectedTags, 
  onTagsChange, 
  allTags 
}: SearchBarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onTagsChange([]);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className="flex-1 max-w-2xl">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            placeholder="Search references by title, description, or notes..."
            className="pl-10 pr-4 h-10 bg-white/70 backdrop-blur-sm border-white/20 focus:bg-white focus:border-indigo-200"
          />
        </div>

        {/* Tag Filter Popover */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={`h-10 bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white hover:border-indigo-200 ${
                selectedTags.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filter by Tags</h4>
                    {selectedTags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTagsChange([])}
                        className="h-6 text-xs hover:text-red-600"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Selected Tags */}
                  {selectedTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Selected</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map((tag: string) => (
                          <Badge 
                            key={tag} 
                            variant="default" 
                            className="flex items-center gap-1 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Tags */}
                  {allTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Available</p>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {allTags
                          .filter((tag: string) => !selectedTags.includes(tag))
                          .map((tag: string) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {allTags.length === 0 && (
                    <div className="text-center py-4">
                      <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No tags available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-10 text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}