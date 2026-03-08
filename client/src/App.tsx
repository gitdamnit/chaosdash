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
import GoblinTools from "@/pages/GoblinTools";
import Research from "@/pages/Research";
import Mindfulness from "@/pages/Mindfulness";
import Planner from "@/pages/Planner";
import Goals from "@/pages/Goals";
import MoodTracker from "@/pages/MoodTracker";
import { AppProvider } from "@/lib/useAppState";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/projects" component={Projects} />
        <Route path="/planner" component={Planner} />
        <Route path="/goblin" component={GoblinTools} />
        <Route path="/mindfulness" component={Mindfulness} />
        <Route path="/research" component={Research} />
        <Route path="/routines" component={Routines} />
        <Route path="/goals" component={Goals} />
        <Route path="/mood" component={MoodTracker} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
