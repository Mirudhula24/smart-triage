import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
  'Dizziness', 'Body aches', 'Sore throat', 'Shortness of breath', 'Chest pain'
];

const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'Allergies',
  'Arthritis', 'Thyroid disorder', 'None'
];

export default function PatientIntake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    symptoms: [] as string[],
    symptomDuration: '',
    existingConditions: [] as string[],
    additionalNotes: '',
  });

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleConditionToggle = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      existingConditions: prev.existingConditions.includes(condition)
        ? prev.existingConditions.filter(c => c !== condition)
        : [...prev.existingConditions, condition],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from('patient_intake').insert({
        user_id: user.id,
        age: parseInt(formData.age) || null,
        gender: formData.gender || null,
        symptoms: formData.symptoms,
        symptom_duration: formData.symptomDuration || null,
        existing_conditions: formData.existingConditions.filter(c => c !== 'None'),
        additional_notes: formData.additionalNotes || null,
      });

      if (error) throw error;

      // Create a mock triage result
      await supabase.from('triage_results').insert({
        user_id: user.id,
        urgency: formData.symptoms.some(s => 
          ['Chest pain', 'Shortness of breath'].includes(s)
        ) ? 'high' : formData.symptoms.length > 3 ? 'medium' : 'low',
        recommended_action: formData.symptoms.some(s => 
          ['Chest pain', 'Shortness of breath'].includes(s)
        ) 
          ? 'Seek immediate medical attention or call emergency services.'
          : formData.symptoms.length > 3 
            ? 'Schedule an appointment with your healthcare provider within 24-48 hours.'
            : 'Monitor symptoms and rest. Seek care if symptoms worsen.',
      });

      setIsSubmitted(true);
      toast({
        title: 'Intake submitted successfully',
        description: 'Your information has been recorded and processed.',
      });

      setTimeout(() => {
        navigate('/results');
      }, 2000);
    } catch (error) {
      console.error('Error submitting intake:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit intake. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-urgency-low-bg mb-6">
            <CheckCircle className="h-10 w-10 text-urgency-low" />
          </div>
          <h2 className="text-2xl font-bold text-foreground font-display mb-2">
            Intake Submitted
          </h2>
          <p className="text-muted-foreground text-center">
            Your information is being processed. Redirecting to your triage results...
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Patient Intake Form</h1>
          <p className="text-muted-foreground">
            Please provide information about your symptoms and medical history.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-border shadow-healthcare">
            <CardHeader>
              <CardTitle className="text-lg font-display">Basic Information</CardTitle>
              <CardDescription>Help us understand your current health status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Age and Gender */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    min="0"
                    max="150"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-3">
                <Label>Current Symptoms (select all that apply)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COMMON_SYMPTOMS.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={formData.symptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                      />
                      <Label htmlFor={symptom} className="font-normal cursor-pointer">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Symptom Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">How long have you had these symptoms?</Label>
                <Select
                  value={formData.symptomDuration}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, symptomDuration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less-than-24h">Less than 24 hours</SelectItem>
                    <SelectItem value="1-3-days">1-3 days</SelectItem>
                    <SelectItem value="4-7-days">4-7 days</SelectItem>
                    <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                    <SelectItem value="more-than-2-weeks">More than 2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Existing Conditions */}
              <div className="space-y-3">
                <Label>Pre-existing Conditions (select all that apply)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COMMON_CONDITIONS.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={formData.existingConditions.includes(condition)}
                        onCheckedChange={() => handleConditionToggle(condition)}
                      />
                      <Label htmlFor={condition} className="font-normal cursor-pointer">
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any other information you'd like to share..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Intake Form'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                ⚕️ This information will be used to assess your symptoms. It is not stored permanently
                and is not a substitute for professional medical evaluation.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
