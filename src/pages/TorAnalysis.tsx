import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileUploadSection } from "@/components/tor/FileUploadSection";
import { AnalysisResults } from "@/components/tor/AnalysisResults";
import { PrivacyRiskIndicator } from "@/components/tor/PrivacyRiskIndicator";
import { ProbabilityChart } from "@/components/tor/ProbabilityChart";
import {
    checkBackendHealth,
    predictFromCSV,
    predictFromPCAP,
    downloadResults,
    type PredictionResponse,
} from "@/services/torAnalysisApi";

export default function TorAnalysis() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<'csv' | 'pcap'>('csv');
    const [results, setResults] = useState<PredictionResponse | null>(null);

    useEffect(() => {
        // Check backend health on mount
        checkBackendHealth()
            .then(() => {
                setIsBackendHealthy(true);
                toast({
                    title: "Backend Connected",
                    description: "Tor Analysis API is ready",
                });
            })
            .catch((error) => {
                setIsBackendHealthy(false);
                toast({
                    title: "Backend Offline",
                    description: error.message,
                    variant: "destructive",
                });
            });
    }, [toast]);

    const handleFilesSelected = async (files: { csv?: File; txt?: File; pcap?: File }) => {
        setIsAnalyzing(true);
        setResults(null);

        try {
            let response: PredictionResponse;

            if (analysisMode === 'csv' && files.csv && files.txt) {
                response = await predictFromCSV(files.csv, files.txt);
            } else if (analysisMode === 'pcap' && files.pcap) {
                response = await predictFromPCAP(files.pcap, files.txt);
            } else {
                throw new Error("Missing required files");
            }

            setResults(response);
            toast({
                title: "Analysis Complete",
                description: `Predicted origin: ${response.predicted_class}`,
            });
        } catch (error) {
            toast({
                title: "Analysis Failed",
                description: error instanceof Error ? error.message : "Unknown error occurred",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownload = async () => {
        if (!results) return;

        try {
            const blob = await downloadResults(results);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tor_analysis_results.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Download Complete",
                description: "Results saved as CSV",
            });
        } catch (error) {
            toast({
                title: "Download Failed",
                description: "Could not download results",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/dashboard')}
                            className="hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Tor Traffic Analysis</h1>
                            <p className="text-muted-foreground">
                                Probabilistic inference of Tor traffic origin using HMM & LSTM models
                            </p>
                        </div>
                    </div>

                    {/* Backend Status */}
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${isBackendHealthy === null
                                    ? 'bg-yellow-500'
                                    : isBackendHealthy
                                        ? 'bg-green-500 animate-pulse'
                                        : 'bg-red-500'
                                }`}
                        />
                        <span className="text-sm text-muted-foreground">
                            {isBackendHealthy === null
                                ? 'Checking...'
                                : isBackendHealthy
                                    ? 'Backend Online'
                                    : 'Backend Offline'}
                        </span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 bg-black/40 backdrop-blur-md border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-6 h-6 text-chameleon-purple" />
                                <h2 className="text-xl font-semibold text-white">Analysis Mode</h2>
                            </div>

                            <Tabs value={analysisMode} onValueChange={(v) => setAnalysisMode(v as 'csv' | 'pcap')}>
                                <TabsList className="grid w-full grid-cols-2 bg-white/5">
                                    <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                                    <TabsTrigger value="pcap">PCAP Upload</TabsTrigger>
                                </TabsList>
                                <TabsContent value="csv" className="mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Upload CSV file with traffic features and TXT file with metadata
                                    </p>
                                </TabsContent>
                                <TabsContent value="pcap" className="mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Upload PCAP file for automatic feature extraction and analysis
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </Card>

                        <FileUploadSection
                            onFilesSelected={handleFilesSelected}
                            isAnalyzing={isAnalyzing}
                            mode={analysisMode}
                        />
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {results ? (
                            <>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleDownload}
                                        className="bg-gradient-to-r from-chameleon-purple to-chameleon-blue hover:opacity-90"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Results
                                    </Button>
                                </div>

                                <AnalysisResults
                                    predictedClass={results.predicted_class}
                                    confidence={results.confidence}
                                    features={results.features}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PrivacyRiskIndicator
                                        score={results.privacy_risk_score}
                                        level={results.privacy_risk_level}
                                        color={results.privacy_risk_color}
                                    />

                                    <ProbabilityChart
                                        probabilities={results.probabilities}
                                        classes={results.classes}
                                        predictedClass={results.predicted_class}
                                    />
                                </div>

                                {results.timeline_series && results.timeline_series.length > 0 && (
                                    <Card className="p-6 bg-black/40 backdrop-blur-md border-white/10">
                                        <h3 className="text-lg font-semibold mb-2 text-white">PCAP Analysis</h3>
                                        <p className="text-muted-foreground">
                                            Analyzed {results.total_packets} packets from PCAP file
                                        </p>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card className="p-12 bg-black/40 backdrop-blur-md border-white/10 flex flex-col items-center justify-center min-h-[400px]">
                                <Activity className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No Analysis Yet</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    Upload your files and run the analysis to see results here. The system will predict
                                    the likely origin of Tor traffic and assess privacy risks.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
