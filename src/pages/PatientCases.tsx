import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, User, MessageSquare, FileText, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PatientCase {
  id: string;
  user_id: string;
  urgency: 'low' | 'medium' | 'high';
  recommended_action: string | null;
  clinician_notes: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  intake?: {
    age: number | null;
    gender: string | null;
    symptoms: string[];
    symptom_duration: string | null;
    existing_conditions: string[];
  };
  chat?: {
    messages: Array<{ role: string; content: string }>;
  };
}

export default function PatientCases() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      const { data, error } = await supabase
        .from('triage_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cases:', error);
      } else if (data) {
        setCases(data as PatientCase[]);
        if (data.length > 0) {
          setSelectedCase(data[0] as PatientCase);
        }
      }
      setIsLoading(false);
    };

    fetchCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.profile?.full_name?.toLowerCase().includes(search) ||
      c.profile?.email?.toLowerCase().includes(search) ||
      c.urgency.includes(search)
    );
  });

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Patient Case Summary</h1>
          <p className="text-muted-foreground">
            View detailed patient information and triage history.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Patient List */}
            <div className="lg:col-span-1">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredCases.map((patientCase) => (
                  <Card
                    key={patientCase.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedCase?.id === patientCase.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    onClick={() => setSelectedCase(patientCase)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                          <User className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {patientCase.profile?.full_name || 'Anonymous Patient'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(patientCase.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={cn('urgency-badge-' + patientCase.urgency, 'text-xs')}>
                          {patientCase.urgency}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Case Details */}
            <div className="lg:col-span-2">
              {selectedCase ? (
                <Card className="border-border shadow-healthcare">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display">
                          {selectedCase.profile?.full_name || 'Anonymous Patient'}
                        </CardTitle>
                        <CardDescription>
                          Case from {new Date(selectedCase.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <span className={cn('urgency-badge-' + selectedCase.urgency)}>
                        {selectedCase.urgency === 'low' && '🟢 Low Priority'}
                        {selectedCase.urgency === 'medium' && '🟡 Medium Priority'}
                        {selectedCase.urgency === 'high' && '🔴 High Priority'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="summary">
                          <Activity className="h-4 w-4 mr-2" />
                          Summary
                        </TabsTrigger>
                        <TabsTrigger value="intake">
                          <FileText className="h-4 w-4 mr-2" />
                          Intake
                        </TabsTrigger>
                        <TabsTrigger value="chat">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Conversation
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Recommended Action</h4>
                          <p className="text-muted-foreground">
                            {selectedCase.recommended_action || 'No recommendation provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Clinician Notes</h4>
                          <div className="rounded-lg bg-muted p-4 min-h-[100px]">
                            <p className="text-sm text-muted-foreground italic">
                              {selectedCase.clinician_notes || 'No notes added yet. This section is read-only for clinician documentation.'}
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="intake" className="space-y-4">
                        {selectedCase.intake ? (
                          <>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <h4 className="text-sm font-medium text-foreground">Age</h4>
                                <p className="text-muted-foreground">
                                  {selectedCase.intake.age || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-foreground">Gender</h4>
                                <p className="text-muted-foreground capitalize">
                                  {selectedCase.intake.gender || 'Not specified'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Symptoms</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedCase.intake.symptoms?.map((symptom) => (
                                  <span
                                    key={symptom}
                                    className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                                  >
                                    {symptom}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">No intake data available</p>
                        )}
                      </TabsContent>

                      <TabsContent value="chat" className="space-y-3">
                        {selectedCase.chat?.messages ? (
                          selectedCase.chat.messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                'rounded-lg p-3',
                                msg.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-secondary mr-8'
                              )}
                            >
                              <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                                {msg.role}
                              </p>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No conversation data available</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Select a patient to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
