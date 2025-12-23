import React, { useState } from 'react';
import { Download, TestTube2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrackedIP } from '@/types';

interface DemoPcapGeneratorProps {
  onDataGenerated: (newIPs: TrackedIP[]) => void;
}

const DEMO_TOR_DATA = [
  {
    ip_address: '185.220.101.42',
    city: 'Chennai',
    district: 'Chennai District',
    entry_node: 'TorGuard1',
    exit_node: 'ExitDE001',
    latitude: 13.0827,
    longitude: 80.2707,
    threat_level: 'medium',
    packets_captured: 2450,
  },
  {
    ip_address: '192.42.116.16',
    city: 'Coimbatore',
    district: 'Coimbatore District',
    entry_node: 'TorRelay22',
    exit_node: 'ExitUS033',
    latitude: 11.0168,
    longitude: 76.9558,
    threat_level: 'high',
    packets_captured: 5678,
  },
  {
    ip_address: '45.66.35.11',
    city: 'Madurai',
    district: 'Madurai District',
    entry_node: 'TorBridge5',
    exit_node: 'ExitNL009',
    latitude: 9.9252,
    longitude: 78.1198,
    threat_level: 'low',
    packets_captured: 890,
  },
  {
    ip_address: '23.129.64.250',
    city: 'Trichy',
    district: 'Tiruchirappalli District',
    entry_node: 'TorGuard7',
    exit_node: 'ExitFR022',
    latitude: 10.7905,
    longitude: 78.7047,
    threat_level: 'critical',
    packets_captured: 12340,
  },
  {
    ip_address: '199.249.230.87',
    city: 'Salem',
    district: 'Salem District',
    entry_node: 'TorRelay99',
    exit_node: 'ExitUK015',
    latitude: 11.6643,
    longitude: 78.1460,
    threat_level: 'medium',
    packets_captured: 3200,
  },
];

export function DemoPcapGenerator({ onDataGenerated }: DemoPcapGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDemoData = async () => {
    setIsGenerating(true);
    
    try {
      // Insert demo data into tor_tracking table
      const { data: insertedData, error } = await supabase
        .from('tor_tracking')
        .insert(DEMO_TOR_DATA.map(item => ({
          ...item,
          status: 'active',
        })))
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Convert to TrackedIP format
      const newTrackedIPs: TrackedIP[] = (insertedData || []).map((item: any) => ({
        id: item.id,
        ip: item.ip_address,
        country: 'India',
        city: item.city,
        region: item.district || 'Tamil Nadu',
        lat: Number(item.latitude) || 13.0827,
        lng: Number(item.longitude) || 80.2707,
        firstSeen: new Date(item.first_seen),
        lastSeen: new Date(item.last_seen),
        requestCount: item.packets_captured || 0,
        bytesTransferred: item.packets_captured * 64,
        threatLevel: item.threat_level,
        riskScore: item.threat_level === 'critical' ? 95 : item.threat_level === 'high' ? 75 : item.threat_level === 'medium' ? 50 : 25,
        behaviors: ['Demo Data', 'Tor Traffic', 'Sample Circuit'],
        exitNode: item.exit_node || 'Unknown',
        fingerprint: `demo-${item.id.slice(0, 8)}`,
      }));

      onDataGenerated(newTrackedIPs);
      
      toast({
        title: 'Demo Data Generated',
        description: `${DEMO_TOR_DATA.length} sample Tor tracking records added`,
      });
    } catch (err: any) {
      console.error('Demo generation error:', err);
      toast({
        title: 'Generation Failed',
        description: err.message || 'Failed to generate demo data',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSamplePcap = () => {
    // Create a simple sample PCAP-like text file for demonstration
    const sampleContent = `# Sample PCAP Data (Demo File)
# This is a demonstration file showing the expected format
# Actual PCAP files are binary and require proper parsing

# Tor Circuit Data Samples:
IP: 185.220.101.42 | Entry: TorGuard1 | Exit: ExitDE001 | Packets: 2450
IP: 192.42.116.16 | Entry: TorRelay22 | Exit: ExitUS033 | Packets: 5678
IP: 45.66.35.11 | Entry: TorBridge5 | Exit: ExitNL009 | Packets: 890
IP: 23.129.64.250 | Entry: TorGuard7 | Exit: ExitFR022 | Packets: 12340
IP: 199.249.230.87 | Entry: TorRelay99 | Exit: ExitUK015 | Packets: 3200

# Note: Upload actual .pcap files captured from network traffic for real analysis
`;
    
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_tor_capture.pcap';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Sample File Downloaded',
      description: 'Sample PCAP file downloaded for reference',
    });
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <TestTube2 className="w-5 h-5 text-chameleon-cyan" />
        Demo Data
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Generate sample Tor tracking data for testing without needing actual PCAP files
      </p>

      <div className="flex flex-col gap-2">
        <Button
          onClick={generateDemoData}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-chameleon-cyan to-chameleon-blue hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <TestTube2 className="w-4 h-4 mr-2" />
              Generate Demo Data
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={downloadSamplePcap}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Sample PCAP
        </Button>
      </div>
    </div>
  );
}
