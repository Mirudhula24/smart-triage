import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Clock, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Stats {
  totalToday: number;
  totalWeek: number;
  highPriority: number;
  avgResponseTime: number;
}

const URGENCY_COLORS = {
  low: 'hsl(145 60% 45%)',
  medium: 'hsl(40 90% 50%)',
  high: 'hsl(0 70% 55%)',
};

export default function WorkloadAnalytics() {
  const [stats, setStats] = useState<Stats>({
    totalToday: 0,
    totalWeek: 0,
    highPriority: 0,
    avgResponseTime: 0,
  });
  const [urgencyData, setUrgencyData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [dailyData, setDailyData] = useState<Array<{ day: string; patients: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();

      // Fetch all triage results
      const { data: allResults } = await supabase
        .from('triage_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (allResults) {
        // Calculate stats
        const today = allResults.filter(r => new Date(r.created_at) >= new Date(todayStart));
        const week = allResults.filter(r => new Date(r.created_at) >= new Date(weekStart));
        const high = allResults.filter(r => r.urgency === 'high');

        setStats({
          totalToday: today.length,
          totalWeek: week.length,
          highPriority: high.length,
          avgResponseTime: Math.round(Math.random() * 10 + 5), // Mock data
        });

        // Urgency distribution
        const low = allResults.filter(r => r.urgency === 'low').length;
        const medium = allResults.filter(r => r.urgency === 'medium').length;
        const highCount = allResults.filter(r => r.urgency === 'high').length;

        setUrgencyData([
          { name: 'Low', value: low, color: URGENCY_COLORS.low },
          { name: 'Medium', value: medium, color: URGENCY_COLORS.medium },
          { name: 'High', value: highCount, color: URGENCY_COLORS.high },
        ]);

        // Daily breakdown (last 7 days)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyStats: { [key: string]: number } = {};
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = days[date.getDay()];
          dailyStats[dayName] = 0;
        }

        allResults.forEach(result => {
          const date = new Date(result.created_at);
          const dayName = days[date.getDay()];
          if (dailyStats[dayName] !== undefined) {
            dailyStats[dayName]++;
          }
        });

        setDailyData(
          Object.entries(dailyStats).map(([day, patients]) => ({ day, patients }))
        );
      }

      setIsLoading(false);
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Workload Analytics</h1>
          <p className="text-muted-foreground">
            Monitor patient flow and triage efficiency metrics.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-healthcare">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Patients Today
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalToday}</div>
              <p className="text-xs text-muted-foreground">
                Total assessments
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-healthcare">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalWeek}</div>
              <p className="text-xs text-muted-foreground">
                7-day total
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-healthcare">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Priority
              </CardTitle>
              <Activity className="h-4 w-4 text-urgency-high" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-urgency-high">{stats.highPriority}</div>
              <p className="text-xs text-muted-foreground">
                Urgent cases
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-healthcare">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Est. Time Saved
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgResponseTime}h</div>
              <p className="text-xs text-muted-foreground">
                Per patient avg
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Patient Volume */}
          <Card className="border-border shadow-healthcare">
            <CardHeader>
              <CardTitle className="font-display">Daily Patient Volume</CardTitle>
              <CardDescription>Number of assessments per day (last 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="patients"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Urgency Distribution */}
          <Card className="border-border shadow-healthcare">
            <CardHeader>
              <CardTitle className="font-display">Urgency Distribution</CardTitle>
              <CardDescription>Breakdown of triage levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={urgencyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {urgencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {urgencyData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
