import { Weapon, WeaponType, Skin, Mission, Rarity } from './types';

export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;
export const ARENA_WIDTH = 2500;
export const ARENA_HEIGHT = 2500;
export const PLAYER_SPEED = 5;
export const PLAYER_RADIUS = 16;
export const PLAYER_MAX_HEALTH_BASE = 100;
export const PLAYER_MAX_HEALTH_PREMIUM = 1000;
export const BULLET_SPEED = 20;
export const BULLET_RADIUS = 3;
export const ADMIN_CODE = "ayazdursun1444";

export const COLORS = {
  player: '#3b82f6',
  bullet: '#fbbf24',
  zombieWalker: '#4ade80',
  zombieRunner: '#f87171',
  zombieTank: '#57534e',
  zombieHand: '#22c55e',
  blood: '#dc2626',
  ground: '#1c1917',
  grassBg: '#14532d',
  grassBlade: '#166534',
  treeTrunk: '#451a03',
  treeLeaves: '#064e3b',
  grid: 'rgba(0,0,0,0.2)',
  arenaBorder: '#7f1d1d',
  uiBg: 'rgba(15, 23, 42, 0.95)',
};

export const RARITY_COLORS: Record<Rarity, string> = {
    standard: '#9ca3af', // gray-400
    rare: '#3b82f6',     // blue-500
    legendary: '#a855f7', // purple-500
    ultra_rare: '#ef4444', // red-500
    gold: '#fbbf24'      // amber-400
};

// --- BASE WEAPONS ---
// Recoil removed (handled in logic), prices updated for unlock system
export const BASE_WEAPONS: Omit<Weapon, 'appliedSkin' | 'purchased' | 'totalAmmo'>[] = [
    // RIFLES
    { id: 'ak47', name: 'AK-47', type: 'rifle', damage: 35, fireRate: 6, magSize: 30, price: 5000, reloadTime: 90, spread: 0.1, range: 1000, isMelee: false, recoil: 0, currentMag: 30 },
    { id: 'm4a1', name: 'M4A1', type: 'rifle', damage: 30, fireRate: 5, magSize: 30, price: 6000, reloadTime: 90, spread: 0.08, range: 1000, isMelee: false, recoil: 0, currentMag: 30 },
    { id: 'scar', name: 'SCAR-L', type: 'rifle', damage: 38, fireRate: 7, magSize: 25, price: 7500, reloadTime: 90, spread: 0.05, range: 1100, isMelee: false, recoil: 0, currentMag: 25 },
    { id: 'famas', name: 'FAMAS', type: 'rifle', damage: 25, fireRate: 4, magSize: 25, price: 4000, reloadTime: 80, spread: 0.12, range: 900, isMelee: false, recoil: 0, currentMag: 25 },
    // SHOTGUNS
    { id: 'nova', name: 'Nova', type: 'shotgun', damage: 15, fireRate: 55, magSize: 7, price: 4500, reloadTime: 120, spread: 0.3, range: 400, isMelee: false, recoil: 0, bulletCount: 8, currentMag: 7 },
    { id: 'xm1014', name: 'XM1014', type: 'shotgun', damage: 12, fireRate: 25, magSize: 6, price: 8000, reloadTime: 110, spread: 0.35, range: 400, isMelee: false, recoil: 0, bulletCount: 6, currentMag: 6 },
    // SNIPERS
    { id: 'awp', name: 'AWP', type: 'sniper', damage: 350, fireRate: 80, magSize: 5, price: 10000, reloadTime: 150, spread: 0, range: 1500, isMelee: false, recoil: 0, currentMag: 5 },
    { id: 'ssg08', name: 'SSG 08', type: 'sniper', damage: 180, fireRate: 70, magSize: 10, price: 6000, reloadTime: 120, spread: 0, range: 1400, isMelee: false, recoil: 0, currentMag: 10 },
    // PISTOLS (Secondary)
    { id: 'glock', name: 'Glock', type: 'pistol', damage: 20, fireRate: 15, magSize: 20, price: 500, reloadTime: 45, spread: 0.1, range: 600, isMelee: false, recoil: 0, currentMag: 20 },
    { id: 'usp', name: 'USP-S', type: 'pistol', damage: 25, fireRate: 18, magSize: 12, price: 1000, reloadTime: 45, spread: 0.05, range: 700, isMelee: false, recoil: 0, currentMag: 12 },
    { id: 'deagle', name: 'Deagle', type: 'pistol', damage: 60, fireRate: 30, magSize: 7, price: 3000, reloadTime: 60, spread: 0.1, range: 900, isMelee: false, recoil: 0, currentMag: 7 },
    // MELEE
    { id: 'knife', name: 'Bıçak', type: 'knife', damage: 40, fireRate: 20, magSize: 1, price: 0, reloadTime: 0, spread: 0, range: 60, isMelee: true, recoil: 0, currentMag: 1 },
    { id: 'karambit', name: 'Karambit', type: 'knife', damage: 55, fireRate: 15, magSize: 1, price: 5000, reloadTime: 0, spread: 0, range: 50, isMelee: true, recoil: 0, currentMag: 1 },
    { id: 'butterfly', name: 'Kelebek', type: 'knife', damage: 50, fireRate: 12, magSize: 1, price: 6000, reloadTime: 0, spread: 0, range: 50, isMelee: true, recoil: 0, currentMag: 1 },
    { id: 'katana', name: 'Katana', type: 'knife', damage: 100, fireRate: 35, magSize: 1, price: 12000, reloadTime: 0, spread: 0, range: 100, isMelee: true, recoil: 0, currentMag: 1 },
];

// --- 1000 SKINS GENERATOR ---
const SKIN_ADJECTIVES: Record<Rarity, {names: string[], colors: string[]}> = {
    standard: {
        names: ['Paslı', 'Eski', 'Standart', 'Çizik', 'Mat', 'Toprak', 'Gri', 'Tozlu', 'Askeri', 'Urban'],
        colors: ['#78716c', '#57534e', '#4b5563', '#64748b', '#52525b', '#713f12', '#3f3f46', '#44403c', '#292524', '#1c1917']
    },
    rare: {
        names: ['Orman', 'Okyanus', 'Buzul', 'Gece', 'Kobalt', 'Zehir', 'Asit', 'Gök', 'Alev', 'Şimşek', 'Kızıl', 'Zümrüt', 'Safir', 'Krom', 'Karbon'],
        colors: ['#15803d', '#1d4ed8', '#0ea5e9', '#1e1b4b', '#172554', '#4d7c0f', '#84cc16', '#0284c7', '#ea580c', '#f59e0b', '#dc2626', '#059669', '#2563eb', '#94a3b8', '#334155']
    },
    legendary: {
        names: ['Ejderha', 'Anka', 'Canavar', 'Hiper', 'Neon', 'Siber', 'Vektör', 'Samuray', 'Hayalet', 'İblis', 'Kıyamet', 'Yıldız', 'Plazma', 'Lazer', 'Kaos', 'Omega', 'Alfa', 'Prime', 'Elit', 'Kabus'],
        colors: ['#ef4444', '#f97316', '#8b5cf6', '#d946ef', '#06b6d4', '#14b8a6', '#f43f5e', '#be123c', '#4338ca', '#7c2d12', '#7f1d1d', '#facc15', '#a855f7', '#ec4899', '#9f1239', '#312e81', '#1e293b', '#fffbeb', '#ffe4e6', '#3730a3']
    },
    ultra_rare: {
        names: ['Galaksi', 'Sonsuzluk', 'Evren', 'Zaman', 'Hiçlik', 'Kozmik', 'Tanrısal', 'Kutsal', 'Ruh', 'Kader'],
        colors: ['#172554', '#4c1d95', '#312e81', '#000000', '#ffffff', '#701a75', '#831843', '#1e3a8a', '#5b21b6', '#4a044e']
    },
    gold: {
        names: ['Altın', 'Kraliyet', 'Midas', 'Hazine', 'Lüks', 'Sultan'],
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#ffd700', '#fcd34d']
    }
};

const generateSkins = (): Skin[] => {
    const skins: Skin[] = [];
    let skinIdCounter = 0;

    // Generate Default Skins (First one for each weapon is hidden/standard)
    BASE_WEAPONS.forEach(w => {
        skins.push({ id: `skin_${w.id}_default`, name: 'Varsayılan', rarity: 'standard', color: '#64748b', weaponId: w.id });
    });

    // Generate Procedural Skins
    BASE_WEAPONS.forEach(w => {
        const createSkin = (rarity: Rarity, count: number) => {
            for (let i = 0; i < count; i++) {
                const adj = SKIN_ADJECTIVES[rarity];
                const nameIdx = Math.floor(Math.random() * adj.names.length);
                const colorIdx = Math.floor(Math.random() * adj.colors.length);
                const uniqueId = `skin_${w.id}_${rarity}_${i}`;
                
                skins.push({
                    id: uniqueId,
                    name: `${adj.names[nameIdx]} ${w.name}`,
                    rarity: rarity,
                    color: adj.colors[colorIdx],
                    weaponId: w.id
                });
            }
        };

        // Distribution of skins per weapon (approx 60 skins per weapon for 15 weapons ~= 900 + defaults)
        createSkin('standard', 25);
        createSkin('rare', 15);
        createSkin('legendary', 10);
        createSkin('ultra_rare', 5);
        createSkin('gold', 2); 
    });

    return skins;
};

export const SKIN_DATABASE = generateSkins();

// --- MISSIONS ---
export const MISSIONS: Mission[] = [
    { id: 1, description: "50 Zombi Öldür", target: 50, rewardType: 'money', rewardValue: 1000, isClaimed: false },
    { id: 2, description: "100 Zombi Öldür", target: 100, rewardType: 'case', rewardValue: 1, isClaimed: false },
    { id: 3, description: "500 Mermi Harca", target: 500, rewardType: 'money', rewardValue: 2000, isClaimed: false },
    { id: 4, description: "10 Round Hayatta Kal", target: 10, rewardType: 'case', rewardValue: 1, isClaimed: false },
    { id: 5, description: "250 Zombi Öldür", target: 250, rewardType: 'case', rewardValue: 2, isClaimed: false },
    { id: 6, description: "Hiç Hasar Almadan 1. Raundu Bitir", target: 1, rewardType: 'money', rewardValue: 5000, isClaimed: false }, // Logic needs specific handling, simplifed to just round complete for now in mock
    { id: 7, description: "1000 Zombi Yok Et (Uzman)", target: 1000, rewardType: 'case', rewardValue: 5, isClaimed: false },
];