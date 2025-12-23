import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import CryptoJS from 'crypto-js';

const SOCKET_SERVER_URL = 'http://localhost:3001';

export interface ChatUser {
    id: string;
    username: string;
    email: string;
    avatar: string;
    status: 'online' | 'offline';
}

export interface ChatChannel {
    name: string;
    p2p: boolean;
    adminUserId: string;
    status: string;
    users: string[];
}

export interface ChatMessage {
    from: string;
    to: string;
    msg: string;
    date: number;
    type: string;
}

interface SocketChatState {
    connected: boolean;
    user: ChatUser | null;
    users: ChatUser[];
    channels: ChatChannel[];
    messages: ChatMessage[];
    currentChannel: string | null;
    typingUsers: string[];
    error: string | null;
}

export function useSocketChat() {
    const [state, setState] = useState<SocketChatState>({
        connected: false,
        user: null,
        users: [],
        channels: [],
        messages: [],
        currentChannel: null,
        typingUsers: [],
        error: null,
    });

    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        console.log('🔌 Connecting to', SOCKET_SERVER_URL);

        const socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('✅ Connected to secure chat server, socket id:', socket.id);
            setState(prev => ({ ...prev, connected: true, error: null }));
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            setState(prev => ({ ...prev, connected: false }));
        });

        socket.on('connect_error', (err) => {
            console.error('Connection error:', err.message);
            setState(prev => ({
                ...prev,
                connected: false,
                error: `Cannot connect to chat server at ${SOCKET_SERVER_URL}. Start the server with: cd temp/src && npm install && node app.js`
            }));
        });

        socket.on('signed', (userData: ChatUser) => {
            console.log('🔐 Signed in:', userData.username);
            setState(prev => ({ ...prev, user: userData }));
        });

        socket.on('update', (data: { users: ChatUser[]; channels: ChatChannel[] }) => {
            console.log('📊 Update received:', data);
            setState(prev => ({
                ...prev,
                users: data.users || [],
                channels: data.channels || [],
            }));
        });

        socket.on('receive', (message: ChatMessage) => {
            console.log('📨 Message received:', message);
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, message],
            }));
        });

        socket.on('fetch-messages', (data: { channel: string; messages: ChatMessage[] }) => {
            if (data.messages) {
                setState(prev => ({ ...prev, messages: data.messages }));
            }
        });

        socket.on('accept', (data: { from: string; channel: string; channelKey?: string }) => {
            console.log('✅ Chat request accepted:', data.channel);
            setState(prev => ({ ...prev, currentChannel: data.channel }));
        });

        socket.on('reject', (data: { from: string; channel: string; msg?: string }) => {
            console.log('❌ Chat request rejected:', data.msg);
            setState(prev => ({ ...prev, error: data.msg || 'Request rejected' }));
        });

        socket.on('typing', (data: { channel: string; user: string }) => {
            setState(prev => ({
                ...prev,
                typingUsers: [...new Set([...prev.typingUsers, data.user])],
            }));
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    typingUsers: prev.typingUsers.filter(u => u !== data.user),
                }));
            }, 2000);
        });

        socket.on('exception', (error: string) => {
            console.error('Chat exception:', error);
            setState(prev => ({ ...prev, error }));
        });

        socket.on('resign', () => {
            setState(prev => ({ ...prev, error: 'Session expired. Please login again.' }));
        });

        socket.on('leave', (data: { username: string; id: string }) => {
            console.log(`👋 ${data.username} left the chat`);
        });

        socketRef.current = socket;
    }, []);

    const login = useCallback((username: string, email: string, password: string) => {
        if (!socketRef.current?.connected) {
            setState(prev => ({ ...prev, error: 'Not connected to server' }));
            return;
        }

        console.log('🔑 Logging in as:', username);

        const hashedPassword = CryptoJS.SHA256(password).toString();
        const encryptedPassword = CryptoJS.TripleDES.encrypt(
            hashedPassword,
            socketRef.current.id!
        ).toString();

        socketRef.current.emit('login', {
            username,
            email,
            password: encryptedPassword,
        });
    }, []);

    const sendMessage = useCallback((channelName: string, message: string) => {
        if (!socketRef.current || !state.user) return;

        console.log('📤 Sending message to', channelName);
        socketRef.current.emit('msg', {
            from: state.user.id,
            to: channelName,
            msg: message,
        });
    }, [state.user]);

    const requestChat = useCallback((channelName: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('request', { channel: channelName });
    }, []);

    const acceptChat = useCallback((userId: string, channelName: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('accept', { to: userId, channel: channelName });
    }, []);

    const createChannel = useCallback((name: string) => {
        if (!socketRef.current) return;
        console.log('➕ Creating channel:', name);
        socketRef.current.emit('createChannel', name);
    }, []);

    const fetchMessages = useCallback((channelName: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('fetch-messages', channelName);
        setState(prev => ({ ...prev, currentChannel: channelName, messages: [] }));
    }, []);

    const sendTyping = useCallback((channelName: string) => {
        if (!socketRef.current) return;
        socketRef.current.emit('typing', channelName);
    }, []);

    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setState({
            connected: false,
            user: null,
            users: [],
            channels: [],
            messages: [],
            currentChannel: null,
            typingUsers: [],
            error: null,
        });
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    return {
        ...state,
        connect,
        login,
        sendMessage,
        requestChat,
        acceptChat,
        createChannel,
        fetchMessages,
        sendTyping,
        disconnect,
        clearError,
    };
}
