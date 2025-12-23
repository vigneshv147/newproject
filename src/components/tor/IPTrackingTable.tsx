import React from 'react';
import { TrackedIP } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, AlertTriangle, HardDrive } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HIGH_TRAFFIC_THRESHOLD } from '@/data/tamilNaduTorData';

interface IPTrackingTableProps {
  trackedIPs: TrackedIP[];
  selectedIP?: TrackedIP | null;
  onSelectIP?: (ip: TrackedIP) => void;
}

const threatBadgeVariants = {
  low: 'bg-status-online/20 text-status-online border-status-online/30',
  medium: 'bg-status-warning/20 text-status-warning border-status-warning/30',
  high: 'bg-chameleon-orange/20 text-chameleon-orange border-chameleon-orange/30',
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function IPTrackingTable({ trackedIPs, selectedIP, onSelectIP }: IPTrackingTableProps) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">IP Address</TableHead>
              <TableHead className="text-muted-foreground font-medium">Location</TableHead>
              <TableHead className="text-muted-foreground font-medium">Threat</TableHead>
              <TableHead className="text-muted-foreground font-medium">Traffic (bytes)</TableHead>
              <TableHead className="text-muted-foreground font-medium">Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trackedIPs.map((ip) => {
              const isHighTraffic = (ip.bytesTransferred || 0) > HIGH_TRAFFIC_THRESHOLD;
              return (
                <TableRow
                  key={ip.id}
                  onClick={() => onSelectIP?.(ip)}
                  className={cn(
                    "cursor-pointer transition-colors border-border/30",
                    selectedIP?.id === ip.id 
                      ? "bg-primary/10 hover:bg-primary/15" 
                      : isHighTraffic
                        ? "bg-destructive/5 hover:bg-destructive/10"
                        : "hover:bg-muted/50"
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        ip.threatLevel === 'low' && "bg-status-online",
                        ip.threatLevel === 'medium' && "bg-status-warning",
                        ip.threatLevel === 'high' && "bg-chameleon-orange",
                        ip.threatLevel === 'critical' && "bg-destructive animate-pulse"
                      )} />
                      <code className="text-sm font-mono">{ip.ip}</code>
                      {isHighTraffic && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{ip.city}, {ip.country}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("capitalize text-xs", threatBadgeVariants[ip.threatLevel])}
                    >
                      {ip.threatLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className={cn(
                        "w-3.5 h-3.5",
                        isHighTraffic ? "text-destructive" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-sm font-mono",
                        isHighTraffic && "text-destructive font-semibold"
                      )}>
                        {(ip.bytesTransferred || ip.requestCount).toLocaleString()}
                      </span>
                      {isHighTraffic && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">HIGH</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(ip.lastSeen, { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}