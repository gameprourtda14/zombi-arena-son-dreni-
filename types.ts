
export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
}

export type WeaponType = 'knife' | 'pistol' | 'rifle' | 'shotgun' | 'sniper';
export type Rarity = 'standard' | 'rare' | 'legendary' | 'ultra_rare' | 'gold';

export interface Skin {
  id: string;
  name: string;
  rarity: Rarity;
  color: string; // The primary render color
  weaponId: string; // Which weapon does this skin belong to
}

export interface Weapon {
  id: string; // Base ID (e.g., 'ak47')
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number; 
  reloadTime: number; 
  magSize: number;
  currentMag: number;
  totalAmmo: number; // Always -1 (Infinite)
  spread: number;
  range: number; 
  isMelee: boolean;
  price: number; // Unlock price
  bulletCount?: number; 
  recoil: number;
  // Dynamic properties applied during game
  appliedSkin?: Skin;
  purchased: boolean;
  color?: string;
}

export interface Mission {
  id: number;
  description: string;
  target: number; // e.g., 50 kills
  rewardType: 'money' | 'case';
  rewardValue: number; // Amount of money or ID of case
  isClaimed: boolean;
}

export interface UserProfile {
  username: string;
  totalMoney: number;
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  isPremium: boolean;
  
  // Inventory
  unlockedWeapons: string[]; // List of Weapon IDs (e.g. 'ak47', 'glock')
  unlockedSkins: string[]; // List of Skin IDs
  cases: number; // Number of cases owned
  
  equippedLoadout: {
      main: string | null; // Weapon ID
      pistol: string; // Weapon ID
      melee: string; // Weapon ID
      skins: { [key: string]: string }; // Map WeaponID -> SkinID
  };

  missions: { [key: number]: number }; // MissionID -> CurrentProgress
  claimedMissions: number[]; // IDs of claimed missions

  stats: {
    totalKills: number;
    totalGames: number;
    highestRound: number;
  }
}

export interface Player extends Entity {
  angle: number; 
  health: number;
  maxHealth: number;
  
  level: number;
  xp: number;
  xpToNextLevel: number;
  money: number; // In-game session money (for score/xp mostly now)

  inventory: [Weapon | null, Weapon, Weapon]; 
  currentSlot: 0 | 1 | 2;
  
  isReloading: boolean;
  reloadTimer: number;
  weaponCooldown: number;
}

export interface Zombie extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  type: 'walker' | 'runner' | 'tank';
  attackCooldown: number;
  value: number;
  xpReward: number;
}

export interface Bullet extends Entity {
  damage: number;
  lifetime: number;
}

export interface Particle {
  id: string;
  pos: Vector2;
  velocity: Vector2;
  color: string;
  life: number;
  maxLife: number;
  decay: number;
  size: number;
  type: 'blood' | 'slash' | 'spark';
}

export interface BloodStain {
  pos: Vector2;
  size: number;
  color: string;
  alpha: number;
}

export interface GameStats {
  kills: number;
  shotsFired: number;
  damageTaken: number;
  timeSurvived: number;
  accuracy: number;
  moneyEarned: number;
  xpEarned: number;
  levelReached: number;
}

export interface AppSettings {
  graphicsQuality: 'low' | 'high';
  isAdmin: boolean;
}
