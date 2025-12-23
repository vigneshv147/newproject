import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Globe, MessageSquare, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const torActivityData = [
  { time: '00:00', traffic: 120 },
  { time: '04:00', traffic: 80 },
  { time: '08:00', traffic: 200 },
  { time: '12:00', traffic: 350 },
  { time: '16:00', traffic: 280 },
  { time: '20:00', traffic: 420 },
  { time: 'Now', traffic: 380 },
];

const threatDistribution = [
  { name: 'Low', value: 45, color: 'hsl(var(--status-online))' },
  { name: 'Medium', value: 30, color: 'hsl(var(--status-warning))' },
  { name: 'High', value: 18, color: 'hsl(var(--status-danger))' },
  { name: 'Critical', value: 7, color: 'hsl(var(--destructive))' },
];

const weeklyMessages = [
  { day: 'Mon', count: 24 },
  { day: 'Tue', count: 32 },
  { day: 'Wed', count: 28 },
  { day: 'Thu', count: 45 },
  { day: 'Fri', count: 38 },
  { day: 'Sat', count: 15 },
  { day: 'Sun', count: 12 },
];

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            trend >= 0 ? 'text-status-online' : 'text-status-danger'
          )}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function DashboardCharts() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Globe}
          label="Active Tor Nodes"
          value="24"
          trend={12}
          color="bg-chameleon-blue/20 text-chameleon-blue"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages Today"
          value="156"
          trend={8}
          color="bg-chameleon-purple/20 text-chameleon-purple"
        />
        <StatCard
          icon={Shield}
          label="Threats Blocked"
          value="47"
          trend={-5}
          color="bg-status-warning/20 text-status-warning"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value="12"
          trend={3}
          color="bg-chameleon-cyan/20 text-chameleon-cyan"
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tor Activity Chart */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Tor Network Activity</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={torActivityData}>
                <defs>
                  <linearGradient id="torGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chameleon-purple))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chameleon-purple))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Area
                  type="monotone"
                  dataKey="traffic"
                  stroke="hsl(var(--chameleon-purple))"
                  fill="url(#torGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Messages */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Weekly Messages</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyMessages}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Bar dataKey="count" fill="hsl(var(--chameleon-blue))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Threat Distribution */}
      <div className="glass-panel p-4">
        <h3 className="font-semibold mb-4">Threat Level Distribution</h3>
        <div className="flex items-center gap-8">
          <div className="w-[150px] h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={threatDistribution}
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            {threatDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
                <span className="text-sm font-medium ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
