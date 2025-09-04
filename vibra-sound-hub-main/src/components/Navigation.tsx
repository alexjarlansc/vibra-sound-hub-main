import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const navItems = [
    { label: "Descobrir", value: "descobrir", active: true },
    { label: "Playlists", value: "playlists", active: false },
    { label: "Top Charts", value: "charts", active: false },
    { label: "Gêneros", value: "generos", active: false },
    { label: "Podcasts", value: "podcasts", active: false },
    { label: "Artistas", value: "artistas", active: false },
  ];

  return (
  <nav className="supports-[backdrop-filter]:bg-background/20 bg-background/55 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl border-b border-white/10 shadow-[0_2px_14px_-6px_rgba(0,0,0,0.2)] relative before:absolute before:inset-0 before:pointer-events-none before:bg-gradient-to-tr before:from-white/6 before:via-transparent before:to-transparent after:absolute after:inset-0 after:pointer-events-none after:bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.15),transparent_55%)]">
  <div className="container mx-auto px-6 relative z-10">
        <div className="flex items-center justify-between py-4">
          <Tabs defaultValue="descobrir" className="w-full">
            <TabsList className="grid w-fit grid-cols-6 bg-muted/30 h-12 p-1 rounded-full">
              {navItems.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="px-6 rounded-full font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="hidden lg:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Recentes</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Favoritos</Button>
            {userId && (
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90" onClick={()=>navigate('/meus-albuns')}>Meus Álbuns</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;