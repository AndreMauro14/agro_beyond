import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { useTransactions } from "@/presentation/contexts/TransactionContext";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { cn } from "@/presentation/utils/cn";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/caixa", label: "Controle de Caixa" },
  { to: "/ocorrencias", label: "Ocorrências" },
  { to: "/calculadora", label: "Calculadora" },
  { to: "/vincular-whatsapp", label: "Meu WhatsApp" },
  { to: "/conectar", label: "Conectar Bot" },
];

export default function Header() {
  const { setOpen } = useTransactions();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-6">
        <NavLink to="/" className="font-display text-xl font-extrabold text-primary">
          Mandaca
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-warning"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            onClick={() => setOpen(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary-glow"
          >
            <Plus className="h-4 w-4" />
            Lançar Transação
          </Button>
          {usuario && (
            <Button variant="ghost" size="icon" onClick={handleLogout} title={`Sair (${usuario.email})`}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
