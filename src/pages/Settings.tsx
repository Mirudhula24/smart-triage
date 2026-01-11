import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Shield, Bell, Trash2 } from 'lucide-react';

export default function Settings() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dataRetention, setDataRetention] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    }
    setIsLoading(false);
  };

  const handleDeleteData = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete all your health data? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    setIsLoading(true);

    try {
      await Promise.all([
        supabase.from('chat_sessions').delete().eq('user_id', user.id),
        supabase.from('patient_intake').delete().eq('user_id', user.id),
        supabase.from('triage_results').delete().eq('user_id', user.id),
        supabase.from('alerts').delete().eq('user_id', user.id),
      ]);

      toast({
        title: 'Data deleted',
        description: 'All your health data has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete data.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground font-display">Settings & Privacy</h1>
          <p className="text-muted-foreground">
            Manage your account settings and data preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="border-border shadow-healthcare">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="font-display">Profile</CardTitle>
              </div>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={userRole?.replace('_', ' ') || 'Unknown'}
                  disabled
                  className="bg-muted capitalize"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="border-border shadow-healthcare">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="font-display">Preferences</CardTitle>
              </div>
              <CardDescription>Configure your notification and data settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts about your triage results
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="retention">Session-Based Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep data only for the current session
                  </p>
                </div>
                <Switch
                  id="retention"
                  checked={dataRetention}
                  onCheckedChange={setDataRetention}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card className="border-border shadow-healthcare">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="font-display">Privacy & Data</CardTitle>
              </div>
              <CardDescription>Manage your health data and privacy settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium text-foreground mb-2">Data Privacy Notice</h4>
                <p className="text-sm text-muted-foreground">
                  Your health information is encrypted and stored securely. We do not share your
                  personal health data with third parties without your explicit consent. You can
                  request deletion of your data at any time.
                </p>
              </div>

              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-destructive mb-1">Delete All Health Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      This will permanently delete all your chat sessions, intake forms, and
                      triage results. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteData}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete My Data'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent Notice */}
          <Card className="border-border bg-muted/50">
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">
                <strong>Consent & Terms:</strong> By using Smart Triage, you acknowledge that this
                tool is for informational purposes only and does not replace professional medical
                advice. Emergency situations should be directed to 911. Your data is processed in
                accordance with our Privacy Policy and HIPAA guidelines where applicable.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
