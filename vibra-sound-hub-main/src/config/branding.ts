export const BRAND = {
  name: "Nomix",
  // Ajuste estes caminhos para seus próprios arquivos na pasta public/
  logo: {
    full: "/logo-nomix.svg", // Substitua pelo seu arquivo ex: /meu-logo.svg
    icon: "/logo-nomix.svg",
    alternatives: [
      "/logo-nomix-alt1.svg",
      "/logo-nomix-alt2.svg",
    ]
  },
  fallbackInitial: "N",
};

export type BrandConfig = typeof BRAND;
