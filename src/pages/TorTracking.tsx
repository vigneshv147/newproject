import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { TorMap } from '@/components/tor/TorMap';
import { IPTrackingTable } from '@/components/tor/IPTrackingTable';
import { IPDetailPanel } from '@/components/tor/IPDetailPanel';
import { PcapUpload } from '@/components/tor/PcapUpload';
import { DemoPcapGenerator } from '@/components/tor/DemoPcapGenerator';
import { supabase } from '@/integrations/supabase/client';
import { TrackedIP, TorNode } from '@/types';
import { Globe, RefreshCw, Download, Filter, Clock, AlertTriangle, Bell, X, Upload, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  worldwideTorNodes,
  generateWorldwideTrackedIPs, 
  getThreatProgressionInfo,
  threatProgressionPhases,
  HIGH_TRAFFIC_THRESHOLD,
  getHighTrafficAlerts
} from '@/data/tamilNaduTorData';

export default function TorTracking() {
  const [selectedIP, setSelectedIP] = useState<TrackedIP | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trackedIPs, setTrackedIPs] = useState<TrackedIP[]>([]);
  const [showThreatInfo, setShowThreatInfo] = useState(false);
  const [highTrafficAlerts, setHighTrafficAlerts] = useState<TrackedIP[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showPcapUpload, setShowPcapUpload] = useState(false);
  const [showDemoGenerator, setShowDemoGenerator] = useState(false);
  const { toast } = useToast();

  const fetchTorData = async () => {
    setIsRefreshing(true);
    
    const { data, error } = await supabase
      .from('tor_tracking')
      .select('*')
      .order('last_seen', { ascending: false });

    if (data && !error && data.length > 0) {
      const mappedData: TrackedIP[] = data.map(item => ({
        id: item.id,
        ip: item.ip_address,
        country: 'India',
        city: item.city,
        region: item.district || 'Tamil Nadu',
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        firstSeen: new Date(item.first_seen),
        lastSeen: new Date(item.last_seen),
        requestCount: item.packets_captured || 0,
        bytesTransferred: item.packets_captured || 0,
        threatLevel: item.threat_level as 'low' | 'medium' | 'high' | 'critical',
        riskScore: item.threat_level === 'critical' ? 95 : item.threat_level === 'high' ? 75 : item.threat_level === 'medium' ? 50 : 25,
        behaviors: ['Encrypted Traffic', 'Tor Exit Node', item.status === 'blocked' ? 'Blocked' : 'Active'],
        exitNode: item.exit_node || 'Unknown',
        fingerprint: `fp-${item.id.slice(0, 8)}`,
      }));
      setTrackedIPs(mappedData);
      checkHighTrafficAlerts(mappedData);
    } else {
      const generatedData = generateWorldwideTrackedIPs(40);
      setTrackedIPs(generatedData);
      checkHighTrafficAlerts(generatedData);
    }

    setTimeout(() => setIsRefreshing(false), 500);
  };

  const checkHighTrafficAlerts = (ips: TrackedIP[]) => {
    const alerts = getHighTrafficAlerts(ips).filter(ip => !dismissedAlerts.has(ip.id));
    setHighTrafficAlerts(alerts);
    
    if (alerts.length > 0) {
      toast({
        title: `⚠️ High Traffic Alert`,
        description: `${alerts.length} IP(s) detected with traffic exceeding ${HIGH_TRAFFIC_THRESHOLD} bytes`,
        variant: 'destructive',
      });
    }
  };

  const dismissAlert = (ipId: string) => {
    setDismissedAlerts(prev => new Set([...prev, ipId]));
    setHighTrafficAlerts(prev => prev.filter(ip => ip.id !== ipId));
  };

  const handlePcapDataImported = (newIPs: TrackedIP[]) => {
    setTrackedIPs(prev => [...newIPs, ...prev]);
    checkHighTrafficAlerts([...newIPs, ...trackedIPs]);
  };

  useEffect(() => {
    fetchTorData();
  }, []);

  const handleExport = () => {
    const csvContent = [
      ['IP Address', 'City', 'Region', 'Country', 'Threat Level', 'Bytes Transferred', 'Entry Node', 'Exit Node'].join(','),
      ...trackedIPs.map(ip => [
        ip.ip,
        ip.city,
        ip.region || ip.city,
        ip.country,
        ip.threatLevel,
        ip.bytesTransferred || 0,
        'Entry',
        ip.exitNode,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tor-tracking-worldwide-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Worldwide Tor tracking data has been exported to CSV',
    });
  };

  const criticalCount = trackedIPs.filter(ip => ip.threatLevel === 'critical').length;
  const highCount = trackedIPs.filter(ip => ip.threatLevel === 'high').length;
  const mediumCount = trackedIPs.filter(ip => ip.threatLevel === 'medium').length;
  const lowCount = trackedIPs.filter(ip => ip.threatLevel === 'low').length;
  
  const tamilNaduCount = trackedIPs.filter(ip => ip.region === 'Tamil Nadu').length;
  const indiaCount = trackedIPs.filter(ip => ip.country === 'India').length;
  const worldwideCount = trackedIPs.filter(ip => ip.country !== 'India').length;

  return (
    <PageLayout title="Tor IP Tracking" subtitle="Worldwide Network Analysis">
      <div className="p-6 space-y-6">
        {/* High Traffic Alerts Banner */}
        {highTrafficAlerts.length > 0 && (
          <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-destructive" />
                <span className="font-semibold text-destructive">
                  {highTrafficAlerts.length} High Traffic Alert(s) - Over {HIGH_TRAFFIC_THRESHOLD} bytes detected
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAlerts(!showAlerts)}>
                {showAlerts ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            {showAlerts && (
              <div className="space-y-2 mt-3">
                {highTrafficAlerts.map(ip => (
                  <div key={ip.id} className="flex items-center justify-between bg-background/50 rounded p-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">{ip.ip}</span>
                      <span className="text-sm text-muted-foreground">{ip.city}, {ip.country}</span>
                      <span className="text-sm font-medium text-destructive">{ip.bytesTransferred} bytes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedIP(ip)}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => dismissAlert(ip.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-6 h-6 text-chameleon-blue" />
              Worldwide Tor Network Monitor
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tracking {trackedIPs.length} IPs globally • {tamilNaduCount} Tamil Nadu • {indiaCount} India • {worldwideCount} International
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {highTrafficAlerts.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowAlerts(!showAlerts)}
              >
                <Bell className="w-4 h-4 mr-2" />
                {highTrafficAlerts.length} Alerts
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowThreatInfo(!showThreatInfo)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Threat Info
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setShowDemoGenerator(!showDemoGenerator); setShowPcapUpload(false); }}
              className={showDemoGenerator ? 'bg-chameleon-cyan/20' : ''}
            >
              <TestTube2 className="w-4 h-4 mr-2" />
              Demo Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setShowPcapUpload(!showPcapUpload); setShowDemoGenerator(false); }}
              className={showPcapUpload ? 'bg-chameleon-purple/20' : ''}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import PCAP
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchTorData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Threat Progression Info Panel */}
        {showThreatInfo && (
          <div className="glass-panel p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-chameleon-purple" />
              Threat Progression Cooldown System
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              IPs are monitored with a cooldown period before threat escalation. Alert threshold: <strong>{HIGH_TRAFFIC_THRESHOLD} bytes</strong>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {threatProgressionPhases.map((phase) => (
                <div 
                  key={phase.level}
                  className={`p-3 rounded-lg border ${
                    phase.level === 'critical' ? 'border-destructive/50 bg-destructive/10' :
                    phase.level === 'high' ? 'border-chameleon-orange/50 bg-chameleon-orange/10' :
                    phase.level === 'medium' ? 'border-status-warning/50 bg-status-warning/10' :
                    'border-status-online/50 bg-status-online/10'
                  }`}
                >
                  <p className="font-medium capitalize text-sm">{phase.level}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cooldown: {phase.cooldown / 3600000}h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {phase.behaviors.slice(0, 2).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PCAP Upload / Demo Generator Section */}
        {(showPcapUpload || showDemoGenerator) && (
          <div className="grid md:grid-cols-2 gap-4">
            {showPcapUpload && <PcapUpload onDataImported={handlePcapDataImported} />}
            {showDemoGenerator && <DemoPcapGenerator onDataGenerated={handlePcapDataImported} />}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold text-chameleon-purple">
              {criticalCount}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold text-chameleon-orange">
              {highCount}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">High Risk</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold text-status-warning">
              {mediumCount}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Medium</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold text-status-online">
              {lowCount}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Low Risk</p>
          </div>
        </div>

        {/* Regional Overview */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-3">Regional Distribution</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-lg font-bold">{tamilNaduCount}</p>
              <p className="text-xs text-muted-foreground">Tamil Nadu</p>
            </div>
            <div className="text-center p-3 bg-chameleon-blue/10 rounded-lg">
              <p className="text-lg font-bold">{indiaCount}</p>
              <p className="text-xs text-muted-foreground">India Total</p>
            </div>
            <div className="text-center p-3 bg-chameleon-purple/10 rounded-lg">
              <p className="text-lg font-bold">{worldwideCount}</p>
              <p className="text-xs text-muted-foreground">International</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Moscow', 'Beijing', 'New York', 'Amsterdam', 'Singapore'].map(city => {
              const count = trackedIPs.filter(ip => ip.city === city).length;
              if (count === 0) return null;
              return (
                <div key={city} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <span className="text-sm">{city}</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className={selectedIP ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="space-y-6">
              <TorMap
                trackedIPs={trackedIPs}
                torNodes={worldwideTorNodes}
                selectedIP={selectedIP}
                onSelectIP={setSelectedIP}
              />
              <IPTrackingTable
                trackedIPs={trackedIPs}
                selectedIP={selectedIP}
                onSelectIP={setSelectedIP}
              />
            </div>
          </div>

          {selectedIP && (
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <IPDetailPanel
                  ip={selectedIP}
                  onClose={() => setSelectedIP(null)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}