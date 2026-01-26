
import { Product, Order, OrderStatus, User, JournalEntry, Achievement, TeaStamp, UserSession } from './types';

export const mockTeas: Product[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `tea-${i + 1}`,
  name: `Premium Blend No. ${i + 1}`,
  categories: i % 2 === 0 ? ['Green Tea'] : ['Oolong Tea'],
  price: 25.00 + i,
  rating: 4.5,
  image: `https://picsum.photos/seed/tea-${i}/800/800`,
  images: [`https://picsum.photos/seed/tea-${i}/800/800`],
  tags: ['Premium'],
  origin: 'Kyoto, Japan',
  caffeine: 'Medium',
  flavorProfile: { floral: 5, grassy: 8, nutty: 2, sweet: 4, earthy: 1 },
  brewing: { temperature: 80, time: 120, instructions: 'Steep gently' },
  story: 'A legendary harvest...',
  format: 'Loose Leaf'
}));

const mockJournal: JournalEntry[] = [
  {
    id: 'j1',
    teaId: 'tea-1',
    teaName: 'Imperial Dragon Well',
    categories: ['Green Tea'],
    origin: 'Hangzhou, China',
    date: 'May 12, 2024',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1594631252845-29fc458695d7?auto=format&fit=crop&q=80&w=600',
    notes: 'Incredible chestnut notes with a lingering sweet finish. Best results with mineral water at 75°C.',
    aroma: ['Nutty', 'Chestnut', 'Fresh Grass'],
    mouthfeel: 'Velvety, smooth',
    context: 'Sunrise Reflection',
    brewParams: { temp: 75, time: 45, vessel: 'Gaiwan' }
  },
  {
    id: 'j2',
    teaId: 'tea-5',
    teaName: 'Gyokuro Precious Dew',
    categories: ['Green Tea'],
    origin: 'Uji, Japan',
    date: 'May 08, 2024',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd1?auto=format&fit=crop&q=80&w=600',
    notes: 'The Umami explosion is intense. Deep emerald color. Pairs perfectly with high-quality wagashi.',
    aroma: ['Oceanic', 'Umami', 'Spinach'],
    mouthfeel: 'Full-bodied, oily',
    context: 'Afternoon Ritual',
    brewParams: { temp: 60, time: 90, vessel: 'Kyusu' }
  }
];

const mockAchievements: Achievement[] = [
  { id: 'a1', title: 'Green Tea Master', description: 'Sampled 10 unique Green Tea harvests', icon: '🍃', rarity: 'Rare', isUnlocked: true, progress: 100, unlockedAt: 'April 2024' },
  { id: 'a2', title: 'Kyoto Explorer', description: 'Completed the Uji Valley collection', icon: '⛩️', rarity: 'Legendary', isUnlocked: true, progress: 100, unlockedAt: 'March 2024' },
  { id: 'a3', title: 'Molecular Architect', description: 'Created 5 custom blending lab rituals', icon: '🧪', rarity: 'Common', isUnlocked: false, progress: 60 },
  { id: 'a4', title: 'Early Bird', description: 'Logged 7 consecutive morning rituals', icon: '🌅', rarity: 'Common', isUnlocked: true, progress: 100, unlockedAt: 'May 2024' }
];

const mockPassport: TeaStamp[] = [
  { id: 's1', region: 'Uji', country: 'Japan', dateStamped: 'Jan 2024', visual: 'JAPAN-01' },
  { id: 's2', region: 'Wuyi', country: 'China', dateStamped: 'Feb 2024', visual: 'CHINA-03' },
  { id: 's3', region: 'Darjeeling', country: 'India', dateStamped: 'April 2024', visual: 'INDIA-05' }
];

const mockSessions: UserSession[] = [
  { id: 'sess-1', device: 'iPhone 15 Pro (Safari)', location: 'Mumbai, IN', lastActive: 'Active now', isCurrent: true },
  { id: 'sess-2', device: 'MacBook Pro 14" (Chrome)', location: 'Bangalore, IN', lastActive: '2 days ago', isCurrent: false },
  { id: 'sess-3', device: 'iPad Air (App)', location: 'London, UK', lastActive: 'May 10, 2024', isCurrent: false }
];

export const mockUser: User = {
  id: 'u-1',
  name: 'Aurelia Vance',
  email: 'aurelia@haven.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  level: 4,
  xp: 750,
  xpToNext: 1000,
  loyaltyPoints: 450,
  stats: {
    teasTried: 24,
    notesWritten: 18,
    streakDays: 12,
    regionsExplored: 5
  },
  journal: mockJournal,
  achievements: mockAchievements,
  passport: mockPassport,
  preferences: ['Green Tea', 'Gongfu Style', 'Floral Notes'],
  sessions: mockSessions,
  security: {
    twoFactorEnabled: true,
    lastPasswordChange: 'March 15, 2024'
  }
};

export const getDetailedOrder = (id: string): Order => ({
  id,
  orderNumber: "TH-2024-5678",
  date: "Jan 15, 2024",
  items: [],
  subtotal: 78.50,
  tax: 6.28,
  shippingCost: 0,
  total: 84.78,
  status: OrderStatus.DELIVERED,
  deliveryAddress: "123 Sanctuary Lane, Kyoto, Japan",
  timeline: []
});
