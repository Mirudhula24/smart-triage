import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageSquare,
  FileText,
  Activity,
  ClipboardList,
  Settings,
  Users,
  AlertTriangle,
  BarChart3,
  LogOut,
  Stethoscope,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const patientNavItems: NavItem[] = [
  { title: 'Chatbot Triage', href: '/triage', icon: MessageSquare },
  { title: 'Patient Intake', href: '/intake', icon: FileText },
  { title: 'Triage Results', href: '/results', icon: Activity },
  { title: 'My Case Summary', href: '/case-summary', icon: ClipboardList },
  { title: 'Settings & Privacy', href: '/settings', icon: Settings },
];

const staffNavItems: NavItem[] = [
  { title: 'Priority Queue', href: '/queue', icon: Users },
  { title: 'Patient Case Summary', href: '/patient-cases', icon: ClipboardList },
  { title: 'Alerts & Flags', href: '/alerts', icon: AlertTriangle },
  { title: 'Workload Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Settings & Privacy', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { userRole, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = userRole === 'healthcare_staff' ? staffNavItems : patientNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Stethoscope className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground">Smart Triage</span>
                <span className="text-xs text-muted-foreground">
                  {userRole === 'healthcare_staff' ? 'Staff Portal' : 'Patient Portal'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <button
                    onClick={() => navigate(item.href)}
                    className={cn(
                      'sidebar-item w-full',
                      isActive && 'sidebar-item-active'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed && user && (
            <div className="mb-3 px-3">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole?.replace('_', ' ')}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="sidebar-item w-full text-destructive hover:bg-destructive/10"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
