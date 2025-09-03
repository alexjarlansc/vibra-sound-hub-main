import { Play, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending Now
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent leading-tight">
              Descubra
              <br />
              Nomix
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Explore milhões de faixas, descubra novos artistas e crie suas playlists personalizadas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 h-12 px-8 rounded-full">
                <Play className="w-5 h-5 mr-2 fill-current" />
                Começar a Ouvir
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-primary/20 hover:bg-primary/5">
                <Plus className="w-5 h-5 mr-2" />
                Criar Playlist
              </Button>
            </div>
          </div>

          {/* Featured Album Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-80 h-80 relative overflow-hidden group cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
              <CardContent className="p-0 h-full">
                <div className="h-full bg-gradient-to-br from-music-card-1 to-music-card-4 flex flex-col justify-between p-8 text-white">
                  <div>
                    <Badge className="bg-white/20 text-white border-white/30 mb-4">
                      Album em Destaque
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2">COWBOY</h3>
                    <h4 className="text-xl font-medium mb-1">PROMOCIONAL 2025</h4>
                    <p className="text-lg opacity-90">Junior</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm opacity-75">
                      12 faixas • 45 min
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full w-12 h-12 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;