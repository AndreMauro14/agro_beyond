export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border/60 bg-footer text-footer-foreground">
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm md:flex-row">
        <span className="font-display font-semibold text-primary">Mandaca</span>
        <span className="text-center text-xs uppercase tracking-wide opacity-80">
          © {year} Mandaca — Gestão Rural Inteligente
        </span>
        <nav className="flex items-center gap-5 text-xs uppercase tracking-wide">
          <a href="#" className="opacity-80 transition-opacity hover:opacity-100">Privacidade</a>
          <a href="#" className="opacity-80 transition-opacity hover:opacity-100">Termos de Uso</a>
          <a href="#" className="opacity-80 transition-opacity hover:opacity-100">Suporte</a>
        </nav>
      </div>
    </footer>
  );
}
