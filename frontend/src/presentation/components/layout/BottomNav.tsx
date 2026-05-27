import { NavLink } from "react-router-dom";
import { Home, Wallet, Calculator, MessageCircle, Plus, Smartphone } from "lucide-react";
import { useTransactions } from "@/presentation/contexts/TransactionContext";
import { cn } from "@/presentation/utils/cn";

const linkBase =
  "flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium transition-colors";

export default function BottomNav() {
  const { setOpen } = useTransactions();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      <ul className="grid grid-cols-6 px-1 py-1">
        <li>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Lançar Transação"
            className={cn(linkBase, "w-full text-warning hover:text-warning")}
          >
            <Plus className="h-5 w-5" />
            <span>Lançar</span>
          </button>
        </li>
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(linkBase, isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            <Home className="h-5 w-5" />
            <span>Início</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/caixa"
            className={({ isActive }) =>
              cn(linkBase, isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            <Wallet className="h-5 w-5" />
            <span>Caixa</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/ocorrencias"
            className={({ isActive }) =>
              cn(linkBase, isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            <MessageCircle className="h-5 w-5" />
            <span>Ocorr.</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/calculadora"
            className={({ isActive }) =>
              cn(linkBase, isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            <Calculator className="h-5 w-5" />
            <span>Calc.</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/conectar"
            className={({ isActive }) =>
              cn(linkBase, isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            <Smartphone className="h-5 w-5" />
            <span>Zap</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
