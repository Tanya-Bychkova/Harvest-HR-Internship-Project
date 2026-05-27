import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth-context";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ProfilePage from "@/pages/profile";
import UsersPage from "@/pages/users";
import TasksPage from "@/pages/tasks";
import DocumentsPage from "@/pages/documents";
import KnowledgePage from "@/pages/knowledge";
import SurveysPage from "@/pages/surveys";
import HrRequestsPage from "@/pages/hr-requests";
import CalendarPage from "@/pages/calendar";
import OnboardingPage from "@/pages/onboarding";
import NotificationsPage from "@/pages/notifications";
import LearningPage from "@/pages/learning";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

function ProtectedRoutes() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 ml-[240px] flex flex-col min-w-0">
        <TopBar />
        <div className="p-6 flex-1 max-w-[1400px]">
          <Switch>
            <Route path="/" component={DashboardPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/users" component={UsersPage} />
            <Route path="/tasks" component={TasksPage} />
            <Route path="/documents" component={DocumentsPage} />
            <Route path="/knowledge" component={KnowledgePage} />
            <Route path="/surveys" component={SurveysPage} />
            <Route path="/hr-requests" component={HrRequestsPage} />
            <Route path="/calendar" component={CalendarPage} />
            <Route path="/onboarding" component={OnboardingPage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/learning" component={LearningPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return <ProtectedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
