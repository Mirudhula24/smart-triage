import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageSquare, FileText, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  created_at: string;
}

interface Intake {
  id: string;
  age: number | null;
  gender: string | null;
  symptoms: string[];
  symptom_duration: string | null;
  existing_conditions: string[];
  additional_notes: string | null;
  created_at: string;
}

interface TriageResult {
  id: string;
  urgency: 'low' | 'medium' | 'high';
  recommended_action: string | null;
  created_at: string;
}

export default function CaseSummary() {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [chatsRes, intakesRes, resultsRes] = await Promise.all([
        supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('patient_intake')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('triage_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (chatsRes.data) setChatSessions(chatsRes.data as unknown as ChatSession[]);
      if (intakesRes.data) setIntakes(intakesRes.data as Intake[]);
      if (resultsRes.data) setTriageResults(resultsRes.data as TriageResult[]);

      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const latestChat = chatSessions[0];
  const latestIntake = intakes[0];
  const latestResult = triageResults[0];

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
          <h1 className="text-2xl font-bold text-foreground font-display">My Case Summary</h1>
          <p className="text-muted-foreground">
            View your complete health assessment history in one place.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="intake">Intake Forms</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border shadow-healthcare">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{chatSessions.length}</p>
                  <p className="text-xs text-muted-foreground">Total conversations</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-healthcare">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Intake Forms</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{intakes.length}</p>
                  <p className="text-xs text-muted-foreground">Submitted forms</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-healthcare">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Assessments</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{triageResults.length}</p>
                  <p className="text-xs text-muted-foreground">Triage results</p>
                </CardContent>
              </Card>
            </div>

            {/* Latest Result */}
            {latestResult && (
              <Card className="border-border shadow-healthcare">
                <CardHeader>
                  <CardTitle className="font-display">Latest Assessment</CardTitle>
                  <CardDescription>
                    {new Date(latestResult.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      'urgency-badge-' + latestResult.urgency,
                      'text-sm'
                    )}>
                      {latestResult.urgency === 'low' && '🟢 Low Priority'}
                      {latestResult.urgency === 'medium' && '🟡 Medium Priority'}
                      {latestResult.urgency === 'high' && '🔴 High Priority'}
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {latestResult.recommended_action}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Latest Intake */}
            {latestIntake && (
              <Card className="border-border shadow-healthcare">
                <CardHeader>
                  <CardTitle className="font-display">Latest Intake Information</CardTitle>
                  <CardDescription>
                    Submitted on {new Date(latestIntake.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Age</p>
                      <p className="text-muted-foreground">{latestIntake.age || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Gender</p>
                      <p className="text-muted-foreground capitalize">
                        {latestIntake.gender?.replace('-', ' ') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {latestIntake.symptoms?.map((symptom) => (
                        <span
                          key={symptom}
                          className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  {latestIntake.existing_conditions?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Pre-existing Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {latestIntake.existing_conditions.map((condition) => (
                          <span
                            key={condition}
                            className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                          >
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4">
            {chatSessions.length === 0 ? (
              <Card className="border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No chat sessions yet</p>
                </CardContent>
              </Card>
            ) : (
              chatSessions.map((session) => (
                <Card key={session.id} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Session from {new Date(session.created_at).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Array.isArray(session.messages) && session.messages.slice(0, 5).map((msg, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                            msg.role === 'user' ? 'bg-secondary' : 'bg-primary text-primary-foreground'
                          )}>
                            {msg.role === 'user' ? <User className="h-3 w-3" /> : 'AI'}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="intake" className="space-y-4">
            {intakes.length === 0 ? (
              <Card className="border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No intake forms submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              intakes.map((intake) => (
                <Card key={intake.id} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Intake from {new Date(intake.created_at).toLocaleDateString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {intake.symptoms?.map((symptom) => (
                        <span
                          key={symptom}
                          className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
