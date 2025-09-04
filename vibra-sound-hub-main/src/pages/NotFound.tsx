import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageShell from "@/components/PageShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageShell
      title="Página não encontrada"
      subtitle="O recurso solicitado não existe ou foi movido."
    >
      <div className="panel p-10 flex flex-col items-start gap-6">
        <p className="text-muted-foreground max-w-md">
          Verifique a URL ou volte para a página inicial.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </a>
      </div>
    </PageShell>
  );
};

export default NotFound;
