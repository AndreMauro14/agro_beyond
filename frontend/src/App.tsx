import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/presentation/components/ui/sonner";
import { Toaster } from "@/presentation/components/ui/toaster";
import { TooltipProvider } from "@/presentation/components/ui/tooltip";
import { TransactionProvider } from "@/presentation/contexts/TransactionContext";
import { AuthProvider } from "@/presentation/contexts/AuthContext";
import ProtectedRoute from "@/presentation/components/auth/ProtectedRoute";
import Layout from "@/presentation/components/layout/Layout";
import Index from "@/presentation/pages/Index";
import Caixa from "@/presentation/pages/Caixa";
import Calculadora from "@/presentation/pages/Calculadora";
import Ocorrencias from "@/presentation/pages/Ocorrencias";
import Conectar from "@/presentation/pages/Conectar";
import Login from "@/presentation/pages/Login";
import Registro from "@/presentation/pages/Registro";
import NotFound from "@/presentation/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TransactionProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/caixa" element={<Caixa />} />
                  <Route path="/calculadora" element={<Calculadora />} />
                  <Route path="/ocorrencias" element={<Ocorrencias />} />
                  <Route path="/conectar" element={<Conectar />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TransactionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
