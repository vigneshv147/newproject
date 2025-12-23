import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface PrivacyRiskIndicatorProps {
    score: number;
    level: string;
    color: string;
}

export function PrivacyRiskIndicator({ score, level, color }: PrivacyRiskIndicatorProps) {
    const percentage = score * 100;

    const getIcon = () => {
        switch (level) {
            case 'Low':
                return <CheckCircle className="w-6 h-6" style={{ color }} />;
            case 'Medium':
                return <AlertTriangle className="w-6 h-6" style={{ color }} />;
            case 'High':
                return <Shield className="w-6 h-6" style={{ color }} />;
            default:
                return <Shield className="w-6 h-6" style={{ color }} />;
        }
    };

    return (
        <Card className="p-6 bg-black/40 backdrop-blur-md border-white/10">
            <div className="flex items-center gap-3 mb-4">
                {getIcon()}
                <div>
                    <h3 className="text-lg font-semibold text-white">Privacy Risk Assessment</h3>
                    <p className="text-sm text-muted-foreground">Based on traffic pattern analysis</p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-white">{level} Risk</span>
                    <span className="text-lg font-semibold text-muted-foreground">{percentage.toFixed(1)}%</span>
                </div>

                <div className="relative">
                    <Progress
                        value={percentage}
                        className="h-3"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                        }}
                    />
                    <div
                        className="absolute top-0 left-0 h-3 rounded-full transition-all duration-500"
                        style={{
                            width: `${percentage}%`,
                            background: color,
                        }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-4">
                    <div className="text-center">
                        <div className="w-full h-1 bg-green-500 rounded mb-1" />
                        <span>Low (0-33%)</span>
                    </div>
                    <div className="text-center">
                        <div className="w-full h-1 bg-yellow-500 rounded mb-1" />
                        <span>Medium (33-66%)</span>
                    </div>
                    <div className="text-center">
                        <div className="w-full h-1 bg-red-500 rounded mb-1" />
                        <span>High (66-100%)</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
