export type Store = {
  id: string;
  name: string;
  city: string;
  distanceKm: number;
  rating: number;
  open: boolean;
  minutes: number;
  tags: string[];
  products: string[];
};

export type Recipe = {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  difficulty: string;
  ingredients: string[];
  accent: string;
};

export const stores: Store[] = [
  { id: '1', name: 'Asia Supermarket Milano', city: 'Milano · Paolo Sarpi', distanceKm: 0.6, rating: 4.7, open: true, minutes: 8, tags: ['Fresco', 'Surgelati', 'Salse'], products: ['Spaghetti di riso', 'Gamberi', 'Bok choy', 'Aceto nero', 'Olio di sesamo'] },
  { id: '2', name: 'Kathay Market', city: 'Milano · Porta Venezia', distanceKm: 1.3, rating: 4.5, open: true, minutes: 15, tags: ['Dim sum', 'Spezie', 'Tè'], products: ['Ravioli surgelati', 'Salsa di soia', 'Pepe Sichuan', 'Tofu', 'Cipollotto'] },
  { id: '3', name: 'Oriente Market', city: 'Milano · Centrale', distanceKm: 2.1, rating: 4.4, open: false, minutes: 22, tags: ['Dispensa', 'Snack', 'Verdure'], products: ['Vermicelli', 'Salsa hoisin', 'Amido di mais', 'Germogli di soia', 'Vino di riso'] }
];

export const recipes: Recipe[] = [
  { id: 'shrimp-noodles', title: 'Spaghetti di riso saltati con gamberi', subtitle: 'Xia Ren Chao Fen Gan', duration: '20 min', difficulty: 'Facile', ingredients: ['Spaghetti di riso', 'Gamberi', 'Uova', 'Germogli di soia'], accent: '#E87652' },
  { id: 'sweet-sour', title: 'Maiale in agrodolce', subtitle: 'Sweet and Sour Pork', duration: '35 min', difficulty: 'Media', ingredients: ['Lonza di maiale', 'Ananas', 'Peperoni', 'Aceto di riso'], accent: '#D85141' },
  { id: 'xiaolongbao', title: 'Xiaolongbao', subtitle: 'Ravioli cinesi in brodo', duration: '50 min', difficulty: 'Avanzata', ingredients: ['Sfoglie per dumpling', 'Carne macinata', 'Zenzero', 'Aceto nero'], accent: '#B95D45' }
];
