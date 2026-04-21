import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import TransactionDialog from "@/presentation/components/transactions/TransactionDialog";
import { useWhatsappStatus } from "@/presentation/hooks/useWhatsappStatus";

export default function Layout() {
  const { data, isLoading } = useWhatsappStatus(2000);
  const location = useLocation();

  const status = data?.status ?? "disconnected";
  const isConnected = status === "connected";
  const isOnConectar = location.pathname === "/conectar";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isConnected && !isOnConectar) {
    return <Navigate to="/conectar" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <div className="h-20 md:hidden" aria-hidden="true" />
      <BottomNav />
      <TransactionDialog />
    </div>
  );
}
