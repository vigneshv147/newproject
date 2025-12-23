import React, { useEffect, useState } from 'react';
import { auditLogger } from '@/lib/security/audit';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Link as LinkIcon, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LogEntry {
    id?: string;
    timestamp: string;
    actor_id: string;
    action: string;
    metadata: string;
    device_fingerprint: string;
    prev_hash: string;
    current_hash: string;
}

export function AuditLogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const loadLogs = async () => {
            if (!user) return;
            const data = await auditLogger.fetchLogs(50);
            setLogs(data);
            setLoading(false);
        };
        loadLogs();
    }, [user]);

    const formatHash = (hash: string) => {
        if (!hash) return 'N/A';
        return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
    };

    return (
        <PermissionGate action="view_audit_logs" fallback={<div className="p-4 text-center text-slate-500">Access Restricted: Authorized Personnel Only</div>}>
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            Immutable Audit Log
                        </CardTitle>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                            Hash Chain Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-950">
                                <TableRow className="hover:bg-transparent border-slate-800">
                                    <TableHead className="text-slate-400">Timestamp</TableHead>
                                    <TableHead className="text-slate-400">Action</TableHead>
                                    <TableHead className="text-slate-400">Actor</TableHead>
                                    <TableHead className="text-slate-400 hidden md:table-cell">Device Sig</TableHead>
                                    <TableHead className="text-slate-400">Integrity (Hash Chain)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            Loading secure logs...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            No audit records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id || log.current_hash} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="font-mono text-xs text-slate-300">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={log.action.includes('DENIED') || log.action.includes('EMERGENCY') ? "destructive" : "default"}
                                                    className={`text-[10px] ${log.action.includes('DENIED') ? 'bg-red-900/50 text-red-200' : 'bg-slate-800 text-cyan-400'}`}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400 font-mono">
                                                {log.actor_id.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-[10px] font-mono text-slate-500">
                                                {log.device_fingerprint ? log.device_fingerprint.substring(0, 12) + '...' : 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-[10px] text-emerald-500/80 font-mono">
                                                        <LinkIcon className="w-3 h-3" />
                                                        {formatHash(log.current_hash)}
                                                    </div>
                                                    <div className="text-[9px] text-slate-600 font-mono pl-4">
                                                        Prev: {formatHash(log.prev_hash)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </PermissionGate>
    );
}
