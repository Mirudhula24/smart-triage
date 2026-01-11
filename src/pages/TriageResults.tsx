import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriageResult {
  id: string;
  urgency: 'low' | 'medium' | 'high';
  recommended_action: string | null;
  created_at: string;
}

const urgencyConfig = {
  low: {
    icon: CheckCircle,
    label: 'Low Priority',
    color: 'text-urgency-low',
    bgColor: 'bg-urgency-low-bg',
    description: 'Your symptoms indicate a non-urgent condition.',
  },
  medium: {
    icon: AlertTriangle,
    label: 'Medium Priority',
    color: 'text-urgency-medium',
    bgColor: 'bg-urgency-medium-bg',
    description: 'Your symptoms require attention within 24-48 hours.',
  },
  high: {
    icon: AlertCircle,
    label: 'High Priority',
    color: 'text-urgency-high',
    bgColor: 'bg-urgency-high-bg',
    description: 'Your symptoms require immediate medical attention.',
  },
};

export default function TriageResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<TriageResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('triage_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching results:', error);
      } else {
        setResults(data as TriageResult[]);
      }
      setIsLoading(false);
    };

    fetchResults();
  }, [user]);

  const latestResult = results[0];

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Triage Results</h1>
          <p className="text-muted-foreground">
            View your symptom assessment results and recommended actions.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <Card className="border-border shadow-healthcare">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Results Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mt-2">
                Complete the chatbot triage or patient intake form to receive your assessment results.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Latest Result - Featured */}
            {latestResult && (
              <Card className="border-border shadow-healthcare overflow-hidden">
                <div className={cn('h-2', urgencyConfig[latestResult.urgency].bgColor)} />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = urgencyConfig[latestResult.urgency].icon;
                      return (
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full',
                          urgencyConfig[latestResult.urgency].bgColor
                        )}>
                          <Icon className={cn('h-6 w-6', urgencyConfig[latestResult.urgency].color)} />
                        </div>
                      );
                    })()}
                    <div>
                      <CardTitle className="font-display">
                        {urgencyConfig[latestResult.urgency].label}
                      </CardTitle>
                      <CardDescription>
                        {urgencyConfig[latestResult.urgency].description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Recommended Action</h4>
                    <p className="text-muted-foreground">
                      {latestResult.recommended_action || 'Please consult with a healthcare provider for personalized guidance.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Assessed on {new Date(latestResult.created_at).toLocaleDateString()} at{' '}
                      {new Date(latestResult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Results */}
            {results.length > 1 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Previous Assessments</h3>
                <div className="space-y-3">
                  {results.slice(1).map((result) => {
                    const Icon = urgencyConfig[result.urgency].icon;
                    return (
                      <Card key={result.id} className="border-border">
                        <CardContent className="flex items-center gap-4 py-4">
                          <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full',
                            urgencyConfig[result.urgency].bgColor
                          )}>
                            <Icon className={cn('h-5 w-5', urgencyConfig[result.urgency].color)} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {urgencyConfig[result.urgency].label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(result.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medical Disclaimer */}
            <Card className="border-border bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Medical Disclaimer:</strong> This assessment is for informational purposes only
                  and does not constitute medical advice, diagnosis, or treatment. Always consult with
                  a qualified healthcare provider for medical concerns. If you're experiencing a medical
                  emergency, call 911 immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
