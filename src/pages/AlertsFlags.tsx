import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Bell, BellOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  user_id: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface HighRiskPatient {
  id: string;
  user_id: string;
  urgency: 'high';
  recommended_action: string | null;
  created_at: string;
}

export default function AlertsFlags() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [highRiskPatients, setHighRiskPatients] = useState<HighRiskPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [alertsRes, patientsRes] = await Promise.all([
        supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('triage_results')
          .select('*')
          .eq('urgency', 'high')
          .order('created_at', { ascending: false }),
      ]);

      if (alertsRes.data) setAlerts(alertsRes.data);
      if (patientsRes.data) setHighRiskPatients(patientsRes.data as HighRiskPatient[]);
      setIsLoading(false);
    };

    fetchData();

    // Subscribe to realtime alerts
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (alertId: string) => {
    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, is_read: true } : a))
    );
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Alerts & Flags</h1>
          <p className="text-muted-foreground">
            Monitor high-risk patients and important notifications.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* High-Risk Patients */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-urgency-high" />
                <h2 className="text-lg font-semibold text-foreground">High-Risk Patients</h2>
                <span className="ml-auto inline-flex items-center rounded-full bg-urgency-high-bg px-2.5 py-0.5 text-xs font-medium text-urgency-high">
                  {highRiskPatients.length}
                </span>
              </div>

              {highRiskPatients.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <CheckCircle className="h-10 w-10 text-urgency-low mb-3" />
                    <p className="text-muted-foreground text-sm">No high-risk patients</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {highRiskPatients.map((patient) => (
                    <Card
                      key={patient.id}
                      className="border-border border-l-4 border-l-urgency-high shadow-healthcare"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-urgency-high-bg">
                            <AlertTriangle className="h-4 w-4 text-urgency-high" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              Patient requires immediate attention
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {patient.recommended_action || 'Emergency symptoms detected'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(patient.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {alerts.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <BellOff className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No notifications</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={cn(
                        'border-border shadow-healthcare transition-all',
                        !alert.is_read && 'bg-primary/5 border-primary/20'
                      )}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            alert.is_read ? 'bg-muted' : 'bg-primary/10'
                          )}>
                            <Bell className={cn(
                              'h-4 w-4',
                              alert.is_read ? 'text-muted-foreground' : 'text-primary'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground capitalize">
                                  {alert.alert_type.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {alert.message}
                                </p>
                              </div>
                              {!alert.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(alert.id)}
                                  className="shrink-0"
                                >
                                  Mark read
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
