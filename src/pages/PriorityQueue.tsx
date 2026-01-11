import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Clock, AlertCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueItem {
  id: string;
  user_id: string;
  urgency: 'low' | 'medium' | 'high';
  recommended_action: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const urgencyConfig = {
  high: { icon: AlertCircle, label: 'High', order: 0 },
  medium: { icon: AlertTriangle, label: 'Medium', order: 1 },
  low: { icon: CheckCircle, label: 'Low', order: 2 },
};

export default function PriorityQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQueue = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('triage_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching queue:', error);
    } else if (data) {
      // Sort by urgency (high first) then by timestamp
      const sortedData = [...data].sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        const urgencyDiff = urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
        if (urgencyDiff !== 0) return urgencyDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setQueue(sortedData as unknown as QueueItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'triage_results' },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredQueue = queue.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.profile?.full_name?.toLowerCase().includes(search) ||
      item.profile?.email?.toLowerCase().includes(search) ||
      item.urgency.includes(search)
    );
  });

  const stats = {
    total: queue.length,
    high: queue.filter(q => q.urgency === 'high').length,
    medium: queue.filter(q => q.urgency === 'medium').length,
    low: queue.filter(q => q.urgency === 'low').length,
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Priority Queue</h1>
            <p className="text-muted-foreground">
              Real-time patient triage queue sorted by urgency.
            </p>
          </div>
          <Button variant="outline" onClick={fetchQueue} disabled={isLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-6 sm:grid-cols-4">
          <Card className="border-border shadow-healthcare">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Patients</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-healthcare border-l-4 border-l-urgency-high">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-urgency-high">{stats.high}</div>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-healthcare border-l-4 border-l-urgency-medium">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-urgency-medium">{stats.medium}</div>
              <p className="text-xs text-muted-foreground">Medium Priority</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-healthcare border-l-4 border-l-urgency-low">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-urgency-low">{stats.low}</div>
              <p className="text-xs text-muted-foreground">Low Priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Queue List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredQueue.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No patients in queue</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQueue.map((item, index) => {
              const Icon = urgencyConfig[item.urgency].icon;
              return (
                <Card
                  key={item.id}
                  className={cn(
                    'border-border shadow-healthcare transition-all hover:shadow-lg cursor-pointer',
                    item.urgency === 'high' && 'border-l-4 border-l-urgency-high'
                  )}
                >
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-medium">
                      {index + 1}
                    </div>
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      `urgency-badge-${item.urgency}`.replace('urgency-badge', 'bg')
                    )}>
                      <Icon className={cn(
                        'h-5 w-5',
                        item.urgency === 'high' && 'text-urgency-high',
                        item.urgency === 'medium' && 'text-urgency-medium',
                        item.urgency === 'low' && 'text-urgency-low'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.profile?.full_name || item.profile?.email || 'Anonymous Patient'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.recommended_action || 'Awaiting assessment'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        `urgency-badge-${item.urgency}`
                      )}>
                        {urgencyConfig[item.urgency].label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
