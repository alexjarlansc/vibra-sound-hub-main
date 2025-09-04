import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-orange-500/80 to-red-500/80 text-white backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">🔔 Fique por Dentro!</h3>
            <p className="text-lg opacity-90 mb-4">Seja notificado sobre os últimos lançamentos</p>
            <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              Inscrever-se
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">📱 App Mobile</h3>
            <p className="text-lg opacity-90 mb-4">Leve sua música para qualquer lugar</p>
            <div className="flex justify-center space-x-4">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">iOS</Button>
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">Android</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CtaSection;
