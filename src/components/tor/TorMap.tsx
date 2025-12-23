import React from 'react';
import { TrackedIP, TorNode } from '@/types';
import { cn } from '@/lib/utils';

interface TorMapProps {
  trackedIPs: TrackedIP[];
  torNodes: TorNode[];
  selectedIP?: TrackedIP | null;
  onSelectIP?: (ip: TrackedIP) => void;
}

// Worldwide map with focus on India/Tamil Nadu
export function TorMap({ trackedIPs, torNodes, selectedIP, onSelectIP }: TorMapProps) {
  // Convert lat/lng to SVG coordinates (World map projection)
  const toCoords = (lat: number, lng: number) => {
    // World bounds: lat -60 to 75, lng -180 to 180
    const minLat = -60;
    const maxLat = 75;
    const minLng = -180;
    const maxLng = 180;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * 780 + 10;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 380 + 10;
    return { x, y };
  };

  const threatColors = {
    low: 'fill-status-online',
    medium: 'fill-status-warning',
    high: 'fill-chameleon-orange',
    critical: 'fill-destructive',
  };

  const threatGlowColors = {
    low: 'hsl(142 70% 45%)',
    medium: 'hsl(38 92% 50%)',
    high: 'hsl(25 95% 53%)',
    critical: 'hsl(0 84% 60%)',
  };

  // Major world regions for reference
  const worldRegions = [
    { name: 'Tamil Nadu', lat: 11.0, lng: 78.0 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
    { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  ];

  return (
    <div className="relative w-full aspect-[2/1] bg-muted/30 rounded-lg overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Simplified world continents outline */}
        <g className="fill-muted/30 stroke-chameleon-blue/20 stroke-[0.5]">
          {/* North America */}
          <path d="M50,100 L180,80 L200,150 L150,200 L100,180 L50,150 Z" />
          {/* South America */}
          <path d="M140,220 L180,200 L200,280 L170,350 L130,320 L120,260 Z" />
          {/* Europe */}
          <path d="M350,80 L420,70 L450,100 L430,140 L380,130 L350,100 Z" />
          {/* Africa */}
          <path d="M380,160 L450,150 L480,200 L470,280 L420,300 L370,260 L360,200 Z" />
          {/* Asia (highlighted for India) */}
          <path d="M450,70 L600,60 L700,100 L720,180 L680,220 L600,200 L500,180 L470,140 Z" className="fill-muted/40" />
          {/* India region (highlighted) */}
          <path d="M500,140 L540,130 L560,160 L540,200 L510,190 L495,160 Z" className="fill-chameleon-blue/10 stroke-chameleon-blue/40 stroke-[1]" />
          {/* Australia */}
          <path d="M640,260 L720,250 L740,300 L700,340 L650,320 L640,280 Z" />
        </g>

        {/* Region labels */}
        {worldRegions.map((region) => {
          const { x, y } = toCoords(region.lat, region.lng);
          return (
            <text
              key={region.name}
              x={x}
              y={y + 18}
              textAnchor="middle"
              className="fill-muted-foreground text-[7px] font-medium"
            >
              {region.name}
            </text>
          );
        })}

        {/* Connection lines between nodes */}
        <g className="stroke-chameleon-blue/30" strokeWidth="1" fill="none">
          {torNodes.map((node) =>
            node.connections.map((targetId) => {
              const target = torNodes.find((n) => n.id === targetId);
              if (!target) return null;
              
              const start = toCoords(node.lat, node.lng);
              const end = toCoords(target.lat, target.lng);
              
              // Calculate control point for curved line
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2 - 20;
              
              return (
                <path
                  key={`${node.id}-${targetId}`}
                  d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                  className="animate-pulse"
                  strokeDasharray="4,4"
                />
              );
            })
          )}
        </g>

        {/* Tor Nodes */}
        {torNodes.map((node) => {
          const { x, y } = toCoords(node.lat, node.lng);
          const color = node.type === 'exit' 
            ? 'fill-chameleon-purple' 
            : node.type === 'entry' 
              ? 'fill-chameleon-cyan' 
              : 'fill-chameleon-blue';
          
          return (
            <g key={node.id}>
              <circle
                cx={x}
                cy={y}
                r="6"
                className={cn(color, "opacity-30 animate-pulse")}
              />
              <circle
                cx={x}
                cy={y}
                r="3"
                className={color}
                filter="url(#glow)"
              />
            </g>
          );
        })}

        {/* Tracked IPs */}
        {trackedIPs.map((ip) => {
          const { x, y } = toCoords(ip.lat, ip.lng);
          const isSelected = selectedIP?.id === ip.id;
          
          return (
            <g
              key={ip.id}
              onClick={() => onSelectIP?.(ip)}
              className="cursor-pointer"
            >
              {/* Pulse ring for high threat */}
              {(ip.threatLevel === 'high' || ip.threatLevel === 'critical') && (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  className={cn(threatColors[ip.threatLevel], "opacity-20")}
                  style={{
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              )}
              
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  className="fill-none stroke-primary stroke-2"
                />
              )}
              
              {/* Main dot */}
              <circle
                cx={x}
                cy={y}
                r="5"
                className={threatColors[ip.threatLevel]}
                style={{
                  filter: `drop-shadow(0 0 5px ${threatGlowColors[ip.threatLevel]})`,
                }}
              />
              
              {/* Country code label */}
              {isSelected && (
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-foreground text-[7px] font-mono"
                >
                  {ip.countryCode || ip.country.slice(0, 2).toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass-panel p-2 space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Worldwide Network</p>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-chameleon-purple" />
            <span className="text-[9px]">Exit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-chameleon-blue" />
            <span className="text-[9px]">Relay</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-chameleon-cyan" />
            <span className="text-[9px]">Entry</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-online" />
            <span className="text-[9px]">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-warning" />
            <span className="text-[9px]">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[9px]">Critical</span>
          </div>
        </div>
      </div>

      {/* India Focus indicator */}
      <div className="absolute top-3 right-3 glass-panel px-2 py-1">
        <span className="text-[9px] text-chameleon-blue font-medium">🇮🇳 India Focus</span>
      </div>
    </div>
  );
}
