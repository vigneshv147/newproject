import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface AnalysisResultsProps {
    predictedClass: string;
    confidence: number;
    features: {
        pkt_rate: number;
        avg_pkt_size: number;
        burstiness: number;
        direction_ratio: number;
        circuit_lifetime: number;
    };
}

export function AnalysisResults({ predictedClass, confidence, features }: AnalysisResultsProps) {
    const featureDescriptions: Record<string, string> = {
        pkt_rate: 'Packet Rate (pkts/s)',
        avg_pkt_size: 'Avg Packet Size (bytes)',
        burstiness: 'Burstiness (0-1)',
        direction_ratio: 'Direction Ratio (0-1)',
        circuit_lifetime: 'Circuit Lifetime (s)',
    };

    return (
        <Card className="p-6 bg-black/40 backdrop-blur-md border-white/10">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Analysis Complete</h2>
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Predicted Origin</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-chameleon-purple to-chameleon-blue bg-clip-text text-transparent">
                            {predictedClass}
                        </p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-sm text-muted-foreground">Confidence</p>
                        <p className="text-3xl font-bold text-white">{(confidence * 100).toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Traffic Features</h3>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-muted-foreground">Feature</TableHead>
                                <TableHead className="text-right text-muted-foreground">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(features).map(([key, value]) => (
                                <TableRow key={key} className="border-white/10 hover:bg-white/5">
                                    <TableCell className="font-medium text-white">
                                        {featureDescriptions[key] || key}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {typeof value === 'number' ? value.toFixed(4) : value}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </Card>
    );
}
