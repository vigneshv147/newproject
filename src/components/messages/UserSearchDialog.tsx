import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface UserProfile {
    id: string;
    user_id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    department: string | null;
    role: string;
}

interface UserSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectUser: (user: UserProfile) => void;
}

export function UserSearchDialog({ open, onOpenChange, onSelectUser }: UserSearchDialogProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Search users when query changes
    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim() || query.length < 2) {
                setUsers([]);
                return;
            }

            setIsLoading(true);
            console.log('Searching for users matching:', query);

            try {
                // First try to search by name 
                let { data, error } = await supabase
                    .from('profiles')
                    .select('id, user_id, name, email, avatar_url, department, role')
                    .ilike('name', `%${query}%`)
                    .neq('user_id', user?.id || '')
                    .limit(10);

                console.log('Name search results:', data, 'Error:', error);

                // If no results by name, try by email
                if ((!data || data.length === 0) && !error) {
                    const emailResult = await supabase
                        .from('profiles')
                        .select('id, user_id, name, email, avatar_url, department, role')
                        .ilike('email', `%${query}%`)
                        .neq('user_id', user?.id || '')
                        .limit(10);

                    data = emailResult.data;
                    error = emailResult.error;
                    console.log('Email search results:', data);
                }

                if (!error && data) {
                    setUsers(data as UserProfile[]);
                } else if (error) {
                    console.error('Search error:', error);
                    setUsers([]);
                }
            } catch (err) {
                console.error('Search exception:', err);
                setUsers([]);
            }
            setIsLoading(false);
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [query, user?.id]);

    const handleSelect = (selectedUser: UserProfile) => {
        onSelectUser(selectedUser);
        setQuery('');
        setUsers([]);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-chameleon-purple" />
                        Start Private Message
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name..."
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

                    {/* Search Results */}
                    <div className="max-h-64 overflow-y-auto space-y-1">
                        {isLoading && (
                            <div className="p-4 text-center text-muted-foreground">
                                <div className="animate-pulse">Searching...</div>
                            </div>
                        )}

                        {!isLoading && query.length >= 2 && users.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground">
                                No users found matching "{query}"
                            </div>
                        )}

                        {!isLoading && query.length > 0 && query.length < 2 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Type at least 2 characters to search
                            </div>
                        )}

                        {users.map((userProfile) => (
                            <button
                                key={userProfile.id}
                                onClick={() => handleSelect(userProfile)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chameleon-purple to-chameleon-blue flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
                                    {userProfile.avatar_url ? (
                                        <img
                                            src={userProfile.avatar_url}
                                            alt={userProfile.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{userProfile.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {userProfile.department || userProfile.role}
                                    </p>
                                </div>
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            </button>
                        ))}
                    </div>

                    {/* Help Text */}
                    {!query && (
                        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
                            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Search for a user by name to start a private end-to-end encrypted conversation.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
