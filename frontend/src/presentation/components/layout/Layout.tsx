import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import TransactionDialog from "@/presentation/components/transactions/TransactionDialog";

export default function Layout() {
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
