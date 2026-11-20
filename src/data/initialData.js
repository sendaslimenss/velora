import noirLobsterImg from "../assets/resto/Noir Lobster.jpg";
import noirFoieGrasImg from "../assets/resto/Noir Foie Gras.jpg";
import midnightMushroomsImg from "../assets/resto/Midnight Mushrooms.jpg";
import goldenScallopsImg from "../assets/resto/Golden Scallops.jpg";
import crispyRoyalShrimpImg from "../assets/resto/Crispy Royal Shrimp.jpg";
import garlicButterPrawnsImg from "../assets/resto/Garlic Butter Prawns.jpg";
import beefWellingtonImg from "../assets/resto/Beef Wellington.jpg";
import braisedShortRibsImg from "../assets/resto/Braised Short Ribs.jpg";
import midnightShortRibsImg from "../assets/resto/Midnight Short Ribs.jpg";
import steakAuPoivreImg from "../assets/resto/Steak au Poivre.jpg";
import duckALOrangeImg from "../assets/resto/Duck à l'Orange.jpg";
import chickenSupremeImg from "../assets/resto/Chicken Supreme.jpg";
import grilledSalmonImg from "../assets/resto/Grilled Salmon.jpg";
import lobsterThermidorImg from "../assets/resto/Lobster Thermidor.jpg";
import lobsterLinguineImg from "../assets/resto/Lobster Linguine.jpg";
import neroTagliatelleImg from "../assets/resto/Nero Tagliatelle.jpg";
import seafoodPastaImg from "../assets/resto/Seafood Pasta.jpg";
import ricottaRavioliImg from "../assets/resto/Ricotta Ravioli.jpg";
import truffleRisottoImg from "../assets/resto/Truffle Risotto.jpg";

// Bespoke dark-luxury SVG plates for Desserts & Boissons (offline-safe, zero broken links)
const createLuxuryPlateSvg = (label, subtitle, motif) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#262018"/>
          <stop offset="55%" stop-color="#121113"/>
          <stop offset="100%" stop-color="#08080A"/>
        </radialGradient>
        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F3D98B"/>
          <stop offset="50%" stop-color="#C5A46D"/>
          <stop offset="100%" stop-color="#8C6D3F"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#bgGlow)"/>
      <rect x="24" y="24" width="752" height="452" fill="none" stroke="url(#goldStroke)" stroke-opacity="0.3" stroke-width="1"/>
      <circle cx="400" cy="215" r="118" fill="#0D0D10" stroke="url(#goldStroke)" stroke-opacity="0.45" stroke-width="1.5"/>
      <circle cx="400" cy="215" r="98" fill="none" stroke="url(#goldStroke)" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="4 6"/>
      ${motif}
      <text x="400" y="385" text-anchor="middle" fill="#F5F1EA" font-family="Georgia, serif" font-size="24" letter-spacing="4">${label}</text>
      <text x="400" y="416" text-anchor="middle" fill="#C5A46D" font-family="system-ui, sans-serif" font-size="12" letter-spacing="5">${subtitle}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const chocolateSphereImg = createLuxuryPlateSvg(
  "SPHÈRE NOIRE & OR 24K",
  "VALRHONA GANACHE • FEUILLE D'OR",
  `<circle cx="400" cy="215" r="46" fill="#2A1B14" stroke="#D4AF37" stroke-width="1.5"/>
   <path d="M368 195 Q400 165 432 195" fill="none" stroke="#F3D98B" stroke-width="2"/>
   <polygon points="400,185 408,200 400,215 392,200" fill="#D4AF37" opacity="0.85"/>`
);

const pistachioTartImg = createLuxuryPlateSvg(
  "VELOURS PISTACHE & ROSE",
  "PRALINÉ TORRÉFIÉ • ÉCLATS D'OR",
  `<polygon points="400,162 452,215 400,268 348,215" fill="#1D261B" stroke="#D4AF37" stroke-width="1.5"/>
   <circle cx="400" cy="215" r="22" fill="#8C6D3F" opacity="0.6"/>`
);

const smokedElixirImg = createLuxuryPlateSvg(
  "ÉLIXIR VELORA FUMÉ",
  "BOURBON INFUSÉ • ÉCORCE D'ORANGE",
  `<path d="M365 168 L435 168 L424 258 L376 258 Z" fill="#1E1610" stroke="#D4AF37" stroke-width="1.5"/>
   <line x1="370" y1="205" x2="430" y2="205" stroke="#F3D98B" stroke-width="1.5"/>`
);

const saffronNectarImg = createLuxuryPlateSvg(
  "NECTAR SAFRAN & BERGAMOTE",
  "INFUSION BOTANIQUE • ZESTE DORÉ",
  `<path d="M368 165 L432 165 L400 220 Z" fill="#241D12" stroke="#D4AF37" stroke-width="1.5"/>
   <line x1="400" y1="220" x2="400" y2="262" stroke="#D4AF37" stroke-width="1.5"/>
   <line x1="376" y1="262" x2="424" y2="262" stroke="#D4AF37" stroke-width="1.5"/>`
);

export const heroImage = noirLobsterImg;

export const CATEGORIES = [
  "Entrées",
  "Plats principaux",
  "Desserts",
  "Boissons",
];

export const ORDER_STATUSES = [
  "En attente",
  "Confirmée",
  "En préparation",
  "Prête",
  "Livrée",
  "Annulée",
];

export const initialDishes = [
  {
    id: 1,
    nom: "Noir Lobster",
    categorie: "Plats principaux",
    description:
      "Queue de homard bleu pochée au beurre noir infusé au charbon végétal, émulsion de bisque safranée et asperges sauvages.",
    prix: 95,
    stock: 8,
    image: noirLobsterImg,
    disponible: true,
  },
  {
    id: 2,
    nom: "Noir Foie Gras",
    categorie: "Entrées",
    description:
      "Escalope de foie gras de canard poêlée, réduction de figues noires au vinaigre balsamique vieilli et brioche toastée.",
    prix: 54,
    stock: 10,
    image: noirFoieGrasImg,
    disponible: true,
  },
  {
    id: 3,
    nom: "Beef Wellington",
    categorie: "Plats principaux",
    description:
      "Filet de bœuf maturité 28 jours en croûte feuilletée dorée, duxelles de champignons forestiers et jus corsé à la truffe.",
    prix: 88,
    stock: 6,
    image: beefWellingtonImg,
    disponible: true,
  },
  {
    id: 4,
    nom: "Golden Scallops",
    categorie: "Entrées",
    description:
      "Noix de Saint-Jacques snackées à l'unilatérale, velouté de topinambour, huile de noisette torréfiée et caviar osciètre.",
    prix: 49,
    stock: 12,
    image: goldenScallopsImg,
    disponible: true,
  },
  {
    id: 5,
    nom: "Truffle Risotto",
    categorie: "Plats principaux",
    description:
      "Risotto Carnaroli crémeux au parmesan affiné 36 mois, copeaux généreux de truffe noire du Périgord et jus réduit.",
    prix: 62,
    stock: 14,
    image: truffleRisottoImg,
    disponible: true,
  },
  {
    id: 6,
    nom: "Midnight Mushrooms",
    categorie: "Entrées",
    description:
      "Poêlée de morilles, girolles et pleurotes rôties à l'ail noir, crème légère au thym frais et crumble de noisettes.",
    prix: 36,
    stock: 15,
    image: midnightMushroomsImg,
    disponible: true,
  },
  {
    id: 7,
    nom: "Crispy Royal Shrimp",
    categorie: "Entrées",
    description:
      "Gambas royales croustillantes en fine dentelle dorée, émulsion citron noir d'Iran et jeunes pousses d'herbes.",
    prix: 44,
    stock: 11,
    image: crispyRoyalShrimpImg,
    disponible: true,
  },
  {
    id: 8,
    nom: "Garlic Butter Prawns",
    categorie: "Entrées",
    description:
      "Crevettes tigrées saisies au beurre demi-sel, ail confit, persil plat et pointe de piment d'Espelette.",
    prix: 42,
    stock: 9,
    image: garlicButterPrawnsImg,
    disponible: true,
  },
  {
    id: 9,
    nom: "Braised Short Ribs",
    categorie: "Plats principaux",
    description:
      "Basses côtes de bœuf confites 12 heures à basse température, mousseline de pommes de terre fumée et glaçage au jus.",
    prix: 74,
    stock: 7,
    image: braisedShortRibsImg,
    disponible: true,
  },
  {
    id: 10,
    nom: "Midnight Short Ribs",
    categorie: "Plats principaux",
    description:
      "Travers de bœuf laqués au café torréfié et mélasse noire, accompagnés de légumes racines glacés au beurre.",
    prix: 76,
    stock: 0,
    image: midnightShortRibsImg,
    disponible: false,
  },
  {
    id: 11,
    nom: "Steak au Poivre",
    categorie: "Plats principaux",
    description:
      "Entrecôte sélectionnée saisie au poivre noir de Kampot concassé, sauce flambée au cognac et pommes grenailles.",
    prix: 72,
    stock: 9,
    image: steakAuPoivreImg,
    disponible: true,
  },
  {
    id: 12,
    nom: "Duck à l'Orange",
    categorie: "Plats principaux",
    description:
      "Magret de canard rosé à la peau croustillante, gastrique d'agrumes caramélisés et purée de patate douce.",
    prix: 68,
    stock: 8,
    image: duckALOrangeImg,
    disponible: true,
  },
  {
    id: 13,
    nom: "Chicken Supreme",
    categorie: "Plats principaux",
    description:
      "Suprême de volaille fermière rôti au beurre d'herbes, sauce crémeuse aux morilles et jeunes carottes glacées.",
    prix: 52,
    stock: 13,
    image: chickenSupremeImg,
    disponible: true,
  },
  {
    id: 14,
    nom: "Grilled Salmon",
    categorie: "Plats principaux",
    description:
      "Pavé de saumon d'Écosse grillé à la flamme, sauce vierge aux câpres, fenouil braisé et émulsion citronnée.",
    prix: 58,
    stock: 11,
    image: grilledSalmonImg,
    disponible: true,
  },
  {
    id: 15,
    nom: "Lobster Thermidor",
    categorie: "Plats principaux",
    description:
      "Homard entier gratiné dans sa carapace, sauce crémeuse à la moutarde ancienne, estragon frais et gruyère affiné.",
    prix: 98,
    stock: 0,
    image: lobsterThermidorImg,
    disponible: false,
  },
  {
    id: 16,
    nom: "Lobster Linguine",
    categorie: "Plats principaux",
    description:
      "Linguine artisanales enrobées d'une réduction de crustacés, médaillons de homard poêlés et tomates confites.",
    prix: 78,
    stock: 7,
    image: lobsterLinguineImg,
    disponible: true,
  },
  {
    id: 17,
    nom: "Nero Tagliatelle",
    categorie: "Plats principaux",
    description:
      "Tagliatelles fraîches à l'encre de seiche, noix de pétoncles, ail doux, huile d'olive extra vierge et poutargue.",
    prix: 64,
    stock: 10,
    image: neroTagliatelleImg,
    disponible: true,
  },
  {
    id: 18,
    nom: "Seafood Pasta",
    categorie: "Plats principaux",
    description:
      "Pâtes fraîches aux fruits de mer de Méditerranée, palourdes, calamars tendres et bisque légère au basilic.",
    prix: 59,
    stock: 12,
    image: seafoodPastaImg,
    disponible: true,
  },
  {
    id: 19,
    nom: "Ricotta Ravioli",
    categorie: "Plats principaux",
    description:
      "Ravioles maison farcies à la ricotta fraîche et zeste de citron, beurre sauge noisette et pignons grillés.",
    prix: 46,
    stock: 14,
    image: ricottaRavioliImg,
    disponible: true,
  },
  {
    id: 20,
    nom: "Sphère Chocolat Noir & Or 24K",
    categorie: "Desserts",
    description:
      "Coque de chocolat grand cru Valrhona 70%, cœur fondant praliné noisette, glace vanille Bourbon et feuille d'or.",
    prix: 28,
    stock: 16,
    image: chocolateSphereImg,
    disponible: true,
  },
  {
    id: 21,
    nom: "Tartelette Velours Pistache & Rose",
    categorie: "Desserts",
    description:
      "Pâte sucrée au cacao noir, crème mousseline à la pistache de Bronte torréfiée et gelée délicate à l'eau de rose.",
    prix: 26,
    stock: 12,
    image: pistachioTartImg,
    disponible: true,
  },
  {
    id: 22,
    nom: "Élixir Velora Fumé",
    categorie: "Boissons",
    description:
      "Création signature sans alcool : infusion boisée fumée au bois de hêtre, réduction d'orange sanguine et sirop d'érable.",
    prix: 22,
    stock: 20,
    image: smokedElixirImg,
    disponible: true,
  },
  {
    id: 23,
    nom: "Nectar Safran & Bergamote",
    categorie: "Boissons",
    description:
      "Infusion glacée aux pistils de safran pur, essence de bergamote fraîche, miel de fleurs sauvages et perles pétillantes.",
    prix: 19,
    stock: 24,
    image: saffronNectarImg,
    disponible: true,
  },
];

export const initialOrders = [
  {
    id: 1001,
    client: "Amine Ben Ali",
    telephone: "+216 22 418 900",
    plats: [
      { dishId: 1, nom: "Noir Lobster", quantite: 2, prix: 95 },
      { dishId: 2, nom: "Noir Foie Gras", quantite: 1, prix: 54 },
    ],
    total: 244,
    date: "2026-11-18",
    statut: "Livrée",
    stockDeducted: true,
  },
  {
    id: 1002,
    client: "Senda Mansour",
    telephone: "+216 55 710 342",
    plats: [
      { dishId: 3, nom: "Beef Wellington", quantite: 2, prix: 88 },
      { dishId: 20, nom: "Sphère Chocolat Noir & Or 24K", quantite: 2, prix: 28 },
    ],
    total: 232,
    date: "2026-11-19",
    statut: "Livrée",
    stockDeducted: true,
  },
  {
    id: 1003,
    client: "Youssef Trabelsi",
    telephone: "+216 98 302 119",
    plats: [
      { dishId: 5, nom: "Truffle Risotto", quantite: 1, prix: 62 },
      { dishId: 4, nom: "Golden Scallops", quantite: 1, prix: 49 },
      { dishId: 22, nom: "Élixir Velora Fumé", quantite: 2, prix: 22 },
    ],
    total: 155,
    date: "2026-11-19",
    statut: "Livrée",
    stockDeducted: true,
  },
  {
    id: 1004,
    client: "Leila Karoui",
    telephone: "+216 24 881 504",
    plats: [
      { dishId: 16, nom: "Lobster Linguine", quantite: 2, prix: 78 },
      { dishId: 21, nom: "Tartelette Velours Pistache & Rose", quantite: 2, prix: 26 },
    ],
    total: 208,
    date: "2026-11-20",
    statut: "Prête",
    stockDeducted: true,
  },
  {
    id: 1005,
    client: "Karim Bouazizi",
    telephone: "+216 50 619 772",
    plats: [
      { dishId: 11, nom: "Steak au Poivre", quantite: 2, prix: 72 },
      { dishId: 6, nom: "Midnight Mushrooms", quantite: 1, prix: 36 },
    ],
    total: 180,
    date: "2026-11-20",
    statut: "En préparation",
    stockDeducted: true,
  },
  {
    id: 1006,
    client: "Nadia Gharbi",
    telephone: "+216 29 945 120",
    plats: [
      { dishId: 17, nom: "Nero Tagliatelle", quantite: 1, prix: 64 },
      { dishId: 23, nom: "Nectar Safran & Bergamote", quantite: 2, prix: 19 },
    ],
    total: 102,
    date: "2026-11-20",
    statut: "En attente",
    stockDeducted: false,
  },
  {
    id: 1007,
    client: "Mehdi Chaabane",
    telephone: "+216 92 147 830",
    plats: [
      { dishId: 12, nom: "Duck à l'Orange", quantite: 1, prix: 68 },
    ],
    total: 68,
    date: "2026-11-17",
    statut: "Annulée",
    stockDeducted: false,
  },
  {
    id: 1008,
    client: "Inès Ben Youssef",
    telephone: "Table 07 • +216 21 504 611",
    plats: [
      { dishId: 4, nom: "Golden Scallops", quantite: 2, prix: 49 },
      { dishId: 14, nom: "Grilled Salmon", quantite: 1, prix: 58 },
    ],
    total: 156,
    date: "2026-11-20",
    statut: "Confirmée",
    stockDeducted: true,
  },
];

export const initialCustomers = [
  { id: 1, nom: "Amine Ben Ali", telephone: "+216 22 418 900" },
  { id: 2, nom: "Senda Mansour", telephone: "+216 55 710 342" },
  { id: 3, nom: "Youssef Trabelsi", telephone: "+216 98 302 119" },
  { id: 4, nom: "Leila Karoui", telephone: "+216 24 881 504" },
  { id: 5, nom: "Karim Bouazizi", telephone: "+216 50 619 772" },
  { id: 6, nom: "Nadia Gharbi", telephone: "+216 29 945 120" },
  { id: 7, nom: "Mehdi Chaabane", telephone: "+216 92 147 830" },
  { id: 8, nom: "Inès Ben Youssef", telephone: "Table 07 • +216 21 504 611" },
];