import { Upload, File, X } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadSectionProps {
    onFilesSelected: (files: { csv?: File; txt?: File; pcap?: File }) => void;
    isAnalyzing: boolean;
    mode: 'csv' | 'pcap';
}

export function FileUploadSection({ onFilesSelected, isAnalyzing, mode }: FileUploadSectionProps) {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [txtFile, setTxtFile] = useState<File | null>(null);
    const [pcapFile, setPcapFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const { toast } = useToast();

    const validateFile = (file: File, expectedType: string): boolean => {
        const maxSize = 16 * 1024 * 1024; // 16MB

        if (file.size > maxSize) {
            toast({
                title: "File too large",
                description: "Maximum file size is 16MB",
                variant: "destructive",
            });
            return false;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        if (expectedType === 'csv' && extension !== 'csv') {
            toast({
                title: "Invalid file type",
                description: "Please upload a CSV file",
                variant: "destructive",
            });
            return false;
        }

        if (expectedType === 'txt' && extension !== 'txt') {
            toast({
                title: "Invalid file type",
                description: "Please upload a TXT file",
                variant: "destructive",
            });
            return false;
        }

        if (expectedType === 'pcap' && !['pcap', 'pcapng'].includes(extension || '')) {
            toast({
                title: "Invalid file type",
                description: "Please upload a PCAP or PCAPNG file",
                variant: "destructive",
            });
            return false;
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'txt' | 'pcap') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateFile(file, type)) return;

        if (type === 'csv') setCsvFile(file);
        else if (type === 'txt') setTxtFile(file);
        else if (type === 'pcap') setPcapFile(file);

        toast({
            title: "File selected",
            description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
    };

    const handleDrop = useCallback((e: React.DragEvent, type: 'csv' | 'txt' | 'pcap') => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (!validateFile(file, type)) return;

        if (type === 'csv') setCsvFile(file);
        else if (type === 'txt') setTxtFile(file);
        else if (type === 'pcap') setPcapFile(file);

        toast({
            title: "File selected",
            description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
    }, [toast]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const removeFile = (type: 'csv' | 'txt' | 'pcap') => {
        if (type === 'csv') setCsvFile(null);
        else if (type === 'txt') setTxtFile(null);
        else if (type === 'pcap') setPcapFile(null);
    };

    const handleAnalyze = () => {
        if (mode === 'csv') {
            if (!csvFile || !txtFile) {
                toast({
                    title: "Missing files",
                    description: "Please upload both CSV and TXT files",
                    variant: "destructive",
                });
                return;
            }
            onFilesSelected({ csv: csvFile, txt: txtFile });
        } else {
            if (!pcapFile) {
                toast({
                    title: "Missing file",
                    description: "Please upload a PCAP file",
                    variant: "destructive",
                });
                return;
            }
            onFilesSelected({ pcap: pcapFile, txt: txtFile || undefined });
        }
    };

    const FileDropZone = ({ type, file, label }: { type: 'csv' | 'txt' | 'pcap', file: File | null, label: string }) => (
        <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${isDragging ? 'border-chameleon-purple bg-chameleon-purple/10' : 'border-white/20 hover:border-chameleon-purple/50'
                } ${file ? 'bg-chameleon-purple/5' : ''}`}
            onDrop={(e) => handleDrop(e, type)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                type="file"
                id={`${type}-upload`}
                className="hidden"
                accept={type === 'csv' ? '.csv' : type === 'txt' ? '.txt' : '.pcap,.pcapng'}
                onChange={(e) => handleFileChange(e, type)}
                disabled={isAnalyzing}
            />

            {file ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <File className="w-8 h-8 text-chameleon-purple" />
                        <div>
                            <p className="font-medium text-white">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(type)}
                        disabled={isAnalyzing}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <label htmlFor={`${type}-upload`} className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">or drag and drop</p>
                </label>
            )}
        </div>
    );

    return (
        <Card className="p-6 bg-black/40 backdrop-blur-md border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-white">Upload Files</h2>

            <div className="space-y-4">
                {mode === 'csv' ? (
                    <>
                        <FileDropZone type="csv" file={csvFile} label="Upload CSV file with traffic features" />
                        <FileDropZone type="txt" file={txtFile} label="Upload TXT file with metadata" />
                    </>
                ) : (
                    <>
                        <FileDropZone type="pcap" file={pcapFile} label="Upload PCAP/PCAPNG file" />
                        <FileDropZone type="txt" file={txtFile} label="Upload TXT file with metadata (optional)" />
                    </>
                )}

                <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (mode === 'csv' ? (!csvFile || !txtFile) : !pcapFile)}
                    className="w-full bg-gradient-to-r from-chameleon-purple to-chameleon-blue hover:opacity-90"
                >
                    {isAnalyzing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Analyzing...
                        </>
                    ) : (
                        'Run Analysis'
                    )}
                </Button>
            </div>
        </Card>
    );
}
