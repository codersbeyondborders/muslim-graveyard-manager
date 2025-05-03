import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Families from "@/pages/families";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Users from "@/pages/users";
import UsersAdd from "@/pages/users-add";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout>
          <Dashboard />
        </AppLayout>
      )} />
      <Route path="/families" component={() => (
        <AppLayout>
          <Families />
        </AppLayout>
      )} />
      <Route path="/payments" component={() => (
        <AppLayout>
          <Payments />
        </AppLayout>
      )} />
      <Route path="/reports" component={() => (
        <AppLayout>
          <Reports />
        </AppLayout>
      )} />
      <Route path="/settings" component={() => (
        <AppLayout>
          <Settings />
        </AppLayout>
      )} />
      <Route path="/users" component={() => (
        <AppLayout>
          <Users />
        </AppLayout>
      )} />
      <Route path="/users/add" component={() => (
        <AppLayout>
          <UsersAdd />
        </AppLayout>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
