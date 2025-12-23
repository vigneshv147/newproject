import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ProbabilityChartProps {
    probabilities: number[];
    classes: string[];
    predictedClass: string;
}

export function ProbabilityChart({ probabilities, classes, predictedClass }: ProbabilityChartProps) {
    const data = classes.map((className, index) => ({
        name: className,
        probability: probabilities[index] * 100,
        isPredict: className === predictedClass,
    }));

    const COLORS = {
        predicted: '#8b5cf6', // chameleon-purple
        other: '#3b82f6', // chameleon-blue
    };

    return (
        <Card className="p-6 bg-black/40 backdrop-blur-md border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">Probability Distribution</h3>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af' }}
                        label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Probability']}
                    />
                    <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.isPredict ? COLORS.predicted : COLORS.other}
                                opacity={entry.isPredict ? 1 : 0.6}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.predicted }} />
                    <span className="text-muted-foreground">Predicted Class</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded opacity-60" style={{ backgroundColor: COLORS.other }} />
                    <span className="text-muted-foreground">Other Classes</span>
                </div>
            </div>
        </Card>
    );
}
