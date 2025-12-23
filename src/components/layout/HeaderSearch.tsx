import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchItem {
  title: string;
  description: string;
  path: string;
  category: string;
}

const searchItems: SearchItem[] = [
  { title: 'Home', description: 'Dashboard overview and platform features', path: '/dashboard', category: 'Pages' },
  { title: 'Secure Messages', description: 'End-to-end encrypted communication', path: '/messages', category: 'Pages' },
  { title: 'Security Center', description: 'Threat assessment and incident response', path: '/security', category: 'Pages' },
  { title: 'Safe Modes', description: 'Emergency protocols and safe communication', path: '/safe-modes', category: 'Pages' },
  { title: 'Settings', description: 'Configure preferences and system parameters', path: '/settings', category: 'Pages' },
  { title: 'Profile', description: 'View and manage your account', path: '/profile', category: 'Account' },
];

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredItems = query.trim()
    ? searchItems.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    )
    : searchItems;

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 hover:bg-muted rounded-md transition-colors relative group"
      >
        <Search className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto p-2">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                  {category}
                </p>
                {items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-start gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
