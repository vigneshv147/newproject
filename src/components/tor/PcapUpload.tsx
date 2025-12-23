import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrackedIP } from '@/types';

interface PcapUploadProps {
  onDataImported: (newIPs: TrackedIP[]) => void;
}

interface PcapParsedData {
  ip_address: string;
  city: string;
  district?: string;
  entry_node?: string;
  exit_node?: string;
  latitude?: number;
  longitude?: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  packets_captured: number;
}

export function PcapUpload({ onDataImported }: PcapUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate file extension
    const validExtensions = ['.pcap', '.pcapng', '.cap'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExt)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PCAP file (.pcap, .pcapng, or .cap)',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setUploadStatus('idle');

    try {
      // Read file as base64
      const base64Content = await readFileAsBase64(file);
      
      // Call edge function to parse PCAP
      const { data, error } = await supabase.functions.invoke('parse-pcap', {
        body: { 
          fileContent: base64Content,
          fileName: file.name
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.parsedData && data.parsedData.length > 0) {
        // Insert parsed data into tor_tracking table
        const { data: insertedData, error: insertError } = await supabase
          .from('tor_tracking')
          .insert(data.parsedData.map((item: PcapParsedData) => ({
            ip_address: item.ip_address,
            city: item.city,
            district: item.district,
            entry_node: item.entry_node,
            exit_node: item.exit_node,
            latitude: item.latitude,
            longitude: item.longitude,
            threat_level: item.threat_level,
            packets_captured: item.packets_captured,
            status: 'active',
          })))
          .select();

        if (insertError) {
          throw new Error(insertError.message);
        }

        // Convert to TrackedIP format for callback
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
          bytesTransferred: item.packets_captured || 0,
          threatLevel: item.threat_level,
          riskScore: item.threat_level === 'critical' ? 95 : item.threat_level === 'high' ? 75 : item.threat_level === 'medium' ? 50 : 25,
          behaviors: ['PCAP Import', 'Tor Traffic'],
          exitNode: item.exit_node || 'Unknown',
          fingerprint: `pcap-${item.id.slice(0, 8)}`,
        }));

        onDataImported(newTrackedIPs);
        setUploadStatus('success');
        
        toast({
          title: 'PCAP Imported Successfully',
          description: `${data.parsedData.length} Tor circuit(s) extracted and added to tracking`,
        });
      } else {
        toast({
          title: 'No Tor Data Found',
          description: 'The PCAP file did not contain identifiable Tor traffic',
        });
        setUploadStatus('error');
      }
    } catch (err: any) {
      console.error('PCAP processing error:', err);
      setUploadStatus('error');
      toast({
        title: 'Processing Failed',
        description: err.message || 'Failed to process PCAP file',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resetUpload = () => {
    setFileName(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Upload className="w-5 h-5 text-chameleon-purple" />
        Import PCAP File
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a PCAP capture file to extract Tor circuit data and add to tracking
      </p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${isDragging ? 'border-chameleon-purple bg-chameleon-purple/10' : 'border-border hover:border-chameleon-purple/50 hover:bg-muted/50'}
          ${isProcessing ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pcap,.pcapng,.cap"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-chameleon-purple animate-spin" />
            <p className="text-sm font-medium">Processing {fileName}...</p>
            <p className="text-xs text-muted-foreground">Extracting Tor circuit data</p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="w-10 h-10 text-status-online" />
            <p className="text-sm font-medium text-status-online">Import Successful</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); resetUpload(); }}>
              Upload Another
            </Button>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="text-sm font-medium text-destructive">Import Failed</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); resetUpload(); }}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Drop PCAP file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .pcap, .pcapng, .cap files</p>
          </>
        )}
      </div>
    </div>
  );
}