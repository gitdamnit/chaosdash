import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import Routines from "@/pages/Routines";
import Settings from "@/pages/Settings";
import FunTools from "@/pages/FunTools";
import Research from "@/pages/Research";
import Mindfulness from "@/pages/Mindfulness";
import Planner from "@/pages/Planner";
import Goals from "@/pages/Goals";
import MoodTracker from "@/pages/MoodTracker";
import BodyDouble from "@/pages/BodyDouble";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import { AppProvider } from "@/lib/useAppState";
import { useAuth } from "@/hooks/use-auth";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src="/adhdpenguin-logo.png" alt="ADHD Penguin" className="w-16 h-16 object-contain mx-auto animate-pulse" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/projects" component={Projects} />
        <Route path="/planner" component={Planner} />
        <Route path="/fun-tools" component={FunTools} />
        <Route path="/mindfulness" component={Mindfulness} />
        <Route path="/research" component={Research} />
        <Route path="/routines" component={Routines} />
        <Route path="/goals" component={Goals} />
        <Route path="/mood" component={MoodTracker} />
        <Route path="/body-double" component={BodyDouble} />
        <Route path="/settings" component={Settings} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Login />;
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <AuthGate />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
