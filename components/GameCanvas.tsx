import React, { useEffect, useRef, useState } from 'react';
import { Player, Zombie, Bullet, Particle, Vector2, BloodStain, GameStats, Weapon, UserProfile, AppSettings } from '../types';
import { 
  PLAYER_SPEED, PLAYER_RADIUS, PLAYER_MAX_HEALTH_BASE, PLAYER_MAX_HEALTH_PREMIUM,
  BULLET_SPEED, BULLET_RADIUS,
  COLORS, ARENA_WIDTH, ARENA_HEIGHT,
  BASE_WEAPONS, SKIN_DATABASE
} from '../constants';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const dist = (v1: Vector2, v2: Vector2) => Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));

interface GameCanvasProps {
  onGameOver: (stats: GameStats) => void;
  isGameActive: boolean;
  userProfile: UserProfile;
  settings: AppSettings;
}

interface DecorObject {
    x: number;
    y: number;
    size: number;
    type: 'grass' | 'tree';
    color?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, isGameActive, userProfile, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const decorRef = useRef<DecorObject[]>([]);
  const inputRef = useRef({
    keys: new Set<string>(),
    mouse: { x: 0, y: 0 },
    mouseDown: false,
  });

  // Construct Player Inventory based on Loadout + Unlocked Skins
  const getInitialInventory = (): [Weapon | null, Weapon, Weapon] => {
      const constructWeapon = (id: string | null): Weapon | null => {
          if (!id) return null;
          const base = BASE_WEAPONS.find(w => w.id === id);
          if (!base) return null;
          
          const skinId = userProfile.equippedLoadout.skins[id];
          const skin = SKIN_DATABASE.find(s => s.id === skinId);
          
          // Apply skin modifiers? Just visual color for now based on request
          return {
              ...base,
              totalAmmo: -1, // Infinite
              purchased: true,
              appliedSkin: skin,
              color: skin ? skin.color : '#64748b' 
          };
      };

      const main = constructWeapon(userProfile.equippedLoadout.main);
      const pistol = constructWeapon(userProfile.equippedLoadout.pistol) || constructWeapon('glock')!;
      const melee = constructWeapon(userProfile.equippedLoadout.melee) || constructWeapon('knife')!;

      return [main, pistol, melee];
  };

  const getInitialGameState = () => ({
    player: {
      id: 'player',
      pos: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: PLAYER_RADIUS,
      color: COLORS.player,
      angle: 0,
      health: userProfile.isPremium ? PLAYER_MAX_HEALTH_PREMIUM : PLAYER_MAX_HEALTH_BASE,
      maxHealth: userProfile.isPremium ? PLAYER_MAX_HEALTH_PREMIUM : PLAYER_MAX_HEALTH_BASE,
      level: userProfile.level,
      xp: userProfile.currentXp,
      xpToNextLevel: userProfile.xpForNextLevel,
      money: 0, // In-game money starts at 0 for score tracking
      inventory: getInitialInventory(),
      currentSlot: 1 as 0 | 1 | 2, 
      isReloading: false,
      reloadTimer: 0,
      weaponCooldown: 0,
    } as Player,
    zombies: [] as Zombie[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    bloodStains: [] as BloodStain[],
    camera: { x: 0, y: 0 },
    score: 0,
    frameCount: 0,
    round: 1,
    zombiesRemainingInRound: 10,
    zombiesActive: 0,
    roundState: 'active' as 'active' | 'waiting',
    roundTimer: 0,
    stats: {
      kills: 0,
      shotsFired: 0,
      damageTaken: 0,
      timeSurvived: 0,
      accuracy: 0,
      moneyEarned: 0,
      xpEarned: 0,
      levelReached: userProfile.level,
    } as GameStats,
    startTime: 0,
    isGameOver: false,
  });

  const gameState = useRef(getInitialGameState());

  const [hudState, setHudState] = useState({
    health: 100,
    maxHealth: 100,
    ammo: 0,
    magSize: 0,
    score: 0,
    level: 1,
    round: 1,
    isReloading: false,
    weaponName: "",
    zombiesLeft: 10
  });

  // Decorations
  useEffect(() => {
      const decors: DecorObject[] = [];
      const treeCount = settings.graphicsQuality === 'high' ? 150 : 50;
      for(let i=0; i<treeCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.max(ARENA_WIDTH, ARENA_HEIGHT)/2 + randomRange(50, 800);
          decors.push({
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              size: randomRange(20, 40),
              type: 'tree'
          });
      }
      if (settings.graphicsQuality === 'high') {
          const grassCount = 1000;
          for(let i=0; i<grassCount; i++) {
              decors.push({
                  x: randomRange(-ARENA_WIDTH/2, ARENA_WIDTH/2),
                  y: randomRange(-ARENA_HEIGHT/2, ARENA_HEIGHT/2),
                  size: randomRange(4, 8),
                  type: 'grass',
                  color: Math.random() > 0.5 ? COLORS.grassBlade : '#14532d'
              });
          }
      }
      decorRef.current = decors;
  }, [settings.graphicsQuality]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gameState.current.frameCount === 0) {
        gameState.current.player.pos = { x: 0, y: 0 }; 
        gameState.current.startTime = Date.now();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape' || e.code === 'KeyP') {
            setIsPaused(prev => !prev);
        }

        if (!isPaused && !gameState.current.isGameOver) {
            inputRef.current.keys.add(e.code);
            const state = gameState.current;
            
            // Switch Weapons
            if (e.code === 'Digit1' && state.player.inventory[0]) {
                state.player.currentSlot = 0; state.player.isReloading = false; state.player.weaponCooldown = 10;
            }
            if (e.code === 'Digit2' && state.player.inventory[1]) {
                state.player.currentSlot = 1; state.player.isReloading = false; state.player.weaponCooldown = 10;
            }
            if (e.code === 'Digit3' && state.player.inventory[2]) {
                state.player.currentSlot = 2; state.player.isReloading = false; state.player.weaponCooldown = 10;
            }
            // Reload
            if (e.code === 'KeyR') {
                const w = state.player.inventory[state.player.currentSlot];
                if (w && !w.isMelee && w.currentMag < w.magSize) {
                    state.player.isReloading = true;
                    state.player.reloadTimer = w.reloadTime;
                }
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => inputRef.current.keys.delete(e.code);
    const handleMouseMove = (e: MouseEvent) => {
      inputRef.current.mouse.x = e.clientX;
      inputRef.current.mouse.y = e.clientY;
    };
    const handleMouseDown = () => inputRef.current.mouseDown = true;
    const handleMouseUp = () => inputRef.current.mouseDown = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    let animationFrameId: number;

    const spawnZombie = () => {
      const state = gameState.current;
      let spawnX, spawnY, d;
      let safety = 0;
      do {
          spawnX = randomRange(-ARENA_WIDTH/2 + 50, ARENA_WIDTH/2 - 50);
          spawnY = randomRange(-ARENA_HEIGHT/2 + 50, ARENA_HEIGHT/2 - 50);
          d = dist({x: spawnX, y: spawnY}, state.player.pos);
          safety++;
      } while(d < 600 && safety < 100);

      const rand = Math.random();
      let type: 'walker' | 'runner' | 'tank' = 'walker';
      let speed = 1.5 + (state.round * 0.1);
      let hp = 30 + (state.round * 5);
      let radius = 14;
      let color = COLORS.zombieWalker;
      let value = 50; 
      let xp = 20;

      if (state.round >= 5 && rand > 0.7) {
        type = 'runner';
        speed = 3.5 + (state.round * 0.15);
        hp = 15 + (state.round * 4);
        color = COLORS.zombieRunner;
        radius = 12;
        value = 75;
        xp = 35;
      } else if (state.round >= 10 && rand > 0.9) {
        type = 'tank';
        speed = 1.0 + (state.round * 0.05);
        hp = 150 + (state.round * 20);
        color = COLORS.zombieTank;
        radius = 24;
        value = 150;
        xp = 100;
      }

      state.zombies.push({
        id: `zombie-${state.frameCount}`,
        pos: { x: spawnX, y: spawnY },
        velocity: { x: 0, y: 0 },
        radius,
        color,
        hp,
        maxHp: hp,
        speed,
        damage: 10 + Math.floor(state.round / 2),
        type,
        attackCooldown: 0,
        value,
        xpReward: xp
      });
      state.zombiesActive++;
    };

    const drawWeapon = (ctx: CanvasRenderingContext2D, weapon: Weapon) => {
        ctx.save();
        ctx.translate(12, 10);
        
        let bodyColor = weapon.color || '#64748b';

        // Simple shape drawing based on type
        switch(weapon.type) {
            case 'knife':
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = '#000'; ctx.fillRect(-2, -2, 6, 4); // Handle
                ctx.fillStyle = bodyColor;
                ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(weapon.range > 70 ? 30 : 16, 0); ctx.lineTo(4, 2); ctx.fill();
                break;
            case 'pistol':
                ctx.fillStyle = bodyColor; ctx.fillRect(0, -3, 12, 6); 
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, -3, 3, 6); 
                break;
            case 'rifle': 
                ctx.fillStyle = '#1e293b'; ctx.fillRect(0, -3, 14, 6); // Main body base
                ctx.fillStyle = bodyColor; ctx.fillRect(4, -3, 10, 6); // Skin part
                ctx.fillStyle = '#334155'; ctx.fillRect(14, -1, 12, 2); // Barrel
                ctx.fillStyle = '#000'; ctx.fillRect(-8, -2, 8, 4); // Stock
                break;
            case 'shotgun':
                ctx.fillStyle = '#27272a'; ctx.fillRect(-8, -2, 8, 4);
                ctx.fillStyle = bodyColor; ctx.fillRect(0, -2, 24, 4);
                ctx.fillStyle = '#713f12'; ctx.fillRect(10, 0, 6, 3);
                break;
            case 'sniper':
                ctx.fillStyle = bodyColor; ctx.fillRect(-6, -3, 35, 6);
                ctx.fillStyle = '#16a34a'; ctx.fillRect(35, -2, 1, 4);
                ctx.fillStyle = '#000'; ctx.fillRect(2, -7, 12, 4);
                break;
        }
        ctx.restore();
    };

    const update = () => {
      const state = gameState.current;
      state.frameCount++;

      if (state.zombiesRemainingInRound > 0) {
          const maxActive = 20 + state.round * 2;
          if (state.zombiesActive < maxActive && state.frameCount % 60 === 0) {
              spawnZombie();
              state.zombiesRemainingInRound--;
          }
      } else if (state.zombiesActive === 0 && state.roundState === 'active') {
          state.roundState = 'waiting';
          state.roundTimer = 180; 
      }

      if (state.roundState === 'waiting') {
          state.roundTimer--;
          if (state.roundTimer <= 0) {
              state.round++;
              state.roundState = 'active';
              state.zombiesRemainingInRound = 10 + Math.floor(state.round * 2.5);
              if (state.player.health < state.player.maxHealth) {
                  state.player.health = Math.min(state.player.maxHealth, state.player.health + 20);
              }
          }
      }

      // Physics
      const moveVec = { x: 0, y: 0 };
      if (inputRef.current.keys.has('KeyW')) moveVec.y -= 1;
      if (inputRef.current.keys.has('KeyS')) moveVec.y += 1;
      if (inputRef.current.keys.has('KeyA')) moveVec.x -= 1;
      if (inputRef.current.keys.has('KeyD')) moveVec.x += 1;
      if (moveVec.x !== 0 || moveVec.y !== 0) {
        const length = Math.sqrt(moveVec.x * moveVec.x + moveVec.y * moveVec.y);
        state.player.pos.x += (moveVec.x / length) * PLAYER_SPEED;
        state.player.pos.y += (moveVec.y / length) * PLAYER_SPEED;
      }
      state.player.pos.x = Math.max(-ARENA_WIDTH/2 + PLAYER_RADIUS, Math.min(ARENA_WIDTH/2 - PLAYER_RADIUS, state.player.pos.x));
      state.player.pos.y = Math.max(-ARENA_HEIGHT/2 + PLAYER_RADIUS, Math.min(ARENA_HEIGHT/2 - PLAYER_RADIUS, state.player.pos.y));

      const screenCenter = { x: canvas.width / 2, y: canvas.height / 2 };
      state.player.angle = Math.atan2(inputRef.current.mouse.y - screenCenter.y, inputRef.current.mouse.x - screenCenter.x);
      state.camera.x = state.player.pos.x - canvas.width / 2;
      state.camera.y = state.player.pos.y - canvas.height / 2;

      // Weapon Firing
      const currentWeapon = state.player.inventory[state.player.currentSlot];
      if (currentWeapon) {
          if (state.player.isReloading) {
             state.player.reloadTimer--;
             if (state.player.reloadTimer <= 0) {
                 state.player.isReloading = false;
                 // Infinite Ammo Logic: Just refill mag
                 currentWeapon.currentMag = currentWeapon.magSize;
             }
          } else {
              if (state.player.weaponCooldown > 0) state.player.weaponCooldown--;
              if (inputRef.current.mouseDown && state.player.weaponCooldown <= 0) {
                  if (currentWeapon.currentMag > 0 || currentWeapon.isMelee) {
                      // Fire
                      const baseAngle = state.player.angle;
                      if (currentWeapon.isMelee) {
                          // Melee logic
                          state.particles.push({ id: Math.random().toString(), pos: { x: state.player.pos.x + Math.cos(baseAngle)*30, y: state.player.pos.y + Math.sin(baseAngle)*30 }, velocity: {x:0, y:0}, life: 5, maxLife: 5, decay: 1, size: 5, type: 'slash', color: '#fff'});
                          state.zombies.forEach(z => {
                              if (dist(state.player.pos, z.pos) < currentWeapon.range && Math.abs(Math.atan2(z.pos.y - state.player.pos.y, z.pos.x - state.player.pos.x) - baseAngle) < 1.2) {
                                  z.hp -= currentWeapon.damage;
                                  z.velocity.x += Math.cos(baseAngle) * 8; z.velocity.y += Math.sin(baseAngle) * 8;
                                  state.particles.push({ id: Math.random().toString(), pos: { ...z.pos }, velocity: {x: Math.random(), y: Math.random()}, life: 10, maxLife: 10, color: COLORS.blood, size: 2, decay: 0.9, type: 'blood'});
                              }
                          });
                          state.player.weaponCooldown = currentWeapon.fireRate;
                      } else {
                          // Ranged logic
                          const pelletCount = currentWeapon.bulletCount || 1;
                          for(let i=0; i<pelletCount; i++) {
                              const spread = currentWeapon.spread;
                              const fireAngle = baseAngle + randomRange(-spread, spread);
                              state.bullets.push({
                                  id: Math.random().toString(),
                                  pos: { x: state.player.pos.x + Math.cos(fireAngle) * 35, y: state.player.pos.y + Math.sin(fireAngle) * 35 },
                                  velocity: { x: Math.cos(fireAngle) * BULLET_SPEED, y: Math.sin(fireAngle) * BULLET_SPEED },
                                  damage: currentWeapon.damage,
                                  lifetime: currentWeapon.range / BULLET_SPEED,
                                  radius: BULLET_RADIUS,
                                  color: COLORS.bullet
                              });
                          }
                          state.stats.shotsFired++;
                          currentWeapon.currentMag--;
                          state.player.weaponCooldown = currentWeapon.fireRate;
                          
                          // Recoil Removed: Player velocity not touched here
                      }
                  } else {
                      // Auto Reload if dry
                      state.player.isReloading = true; state.player.reloadTimer = currentWeapon.reloadTime;
                  }
              }
          }
      }

      state.player.pos.x += state.player.velocity.x;
      state.player.pos.y += state.player.velocity.y;
      state.player.velocity.x *= 0.8; state.player.velocity.y *= 0.8;

      // Update Bullets
      for(let i=state.bullets.length-1; i>=0; i--) {
          const b = state.bullets[i];
          b.pos.x += b.velocity.x; b.pos.y += b.velocity.y;
          b.lifetime--;
          if (b.lifetime <= 0) state.bullets.splice(i, 1);
      }

      // Update Zombies
      for(let i=state.zombies.length-1; i>=0; i--) {
          const z = state.zombies[i];
          const dx = state.player.pos.x - z.pos.x;
          const dy = state.player.pos.y - z.pos.y;
          const distToPlayer = Math.sqrt(dx*dx + dy*dy);
          
          if(distToPlayer > 0) { z.velocity.x += (dx/distToPlayer)*0.2; z.velocity.y += (dy/distToPlayer)*0.2; }
          const speed = Math.sqrt(z.velocity.x**2 + z.velocity.y**2);
          if (speed > z.speed) { z.velocity.x = (z.velocity.x/speed)*z.speed; z.velocity.y = (z.velocity.y/speed)*z.speed; }
          
          z.pos.x += z.velocity.x; z.pos.y += z.velocity.y;

          if (distToPlayer < z.radius + state.player.radius && z.attackCooldown <= 0) {
              if(!settings.isAdmin) {
                  state.player.health -= z.damage;
                  state.stats.damageTaken += z.damage;
              }
              z.attackCooldown = 60;
              if (state.player.health <= 0 && !state.isGameOver) {
                  state.isGameOver = true;
                  state.stats.timeSurvived = (Date.now() - state.startTime) / 1000;
                  state.stats.accuracy = state.stats.shotsFired > 0 ? state.stats.kills / state.stats.shotsFired : 0;
                  state.stats.levelReached = state.player.level;
                  onGameOver(state.stats);
              }
          }
          if (z.attackCooldown > 0) z.attackCooldown--;

          // Bullet Hit
          for (let bIdx = state.bullets.length - 1; bIdx >= 0; bIdx--) {
              const b = state.bullets[bIdx];
              if (dist(b.pos, z.pos) < z.radius + b.radius) {
                  z.hp -= b.damage;
                  z.velocity.x += b.velocity.x * 0.2; z.velocity.y += b.velocity.y * 0.2;
                  state.bullets.splice(bIdx, 1);
                  if (z.hp <= 0) break;
              }
          }

          if (z.hp <= 0) {
              state.zombies.splice(i, 1);
              state.zombiesActive--;
              state.score += (z.type === 'tank' ? 50 : 10);
              state.stats.kills++;
              state.player.money += z.value;
              state.stats.moneyEarned += z.value;
              
              // Level Up
              state.player.xp += z.xpReward;
              state.stats.xpEarned += z.xpReward;
              if (state.player.xp >= state.player.xpToNextLevel) {
                  state.player.level++;
                  state.stats.levelReached = state.player.level;
                  state.player.xp -= state.player.xpToNextLevel;
                  state.player.xpToNextLevel = Math.floor(state.player.xpToNextLevel * 1.5);
                  state.player.maxHealth += 10;
                  state.player.health = state.player.maxHealth;
              }
              state.bloodStains.push({pos: {...z.pos}, size: z.radius*2, color: '#7f1d1d', alpha: 1});
          }
      }

      if (state.frameCount % 5 === 0) {
          const curWep = state.player.inventory[state.player.currentSlot];
          setHudState({
            health: Math.max(0, state.player.health),
            maxHealth: state.player.maxHealth,
            ammo: curWep ? curWep.currentMag : 0,
            magSize: curWep ? curWep.magSize : 0,
            score: state.score,
            level: state.player.level,
            round: state.round,
            isReloading: state.player.isReloading,
            weaponName: curWep ? curWep.name : "Yok",
            zombiesLeft: state.zombiesActive + state.zombiesRemainingInRound
          });
      }
    };

    const draw = () => {
      ctx.fillStyle = COLORS.grassBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const state = gameState.current;
      ctx.save();
      ctx.translate(-state.camera.x, -state.camera.y);

      // Decors
      for (const d of decorRef.current) {
          if (d.x < state.camera.x - 200 || d.x > state.camera.x + canvas.width + 200) continue;
          if (d.type === 'tree') {
              ctx.fillStyle = COLORS.treeLeaves; ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = COLORS.treeTrunk; ctx.beginPath(); ctx.arc(d.x, d.y, d.size / 3, 0, Math.PI * 2); ctx.fill();
          } else if (d.type === 'grass') {
              ctx.fillStyle = d.color || COLORS.grassBlade; ctx.fillRect(d.x, d.y, 2, d.size);
          }
      }

      // Border
      ctx.strokeStyle = COLORS.arenaBorder; ctx.lineWidth = 10; ctx.strokeRect(-ARENA_WIDTH/2, -ARENA_HEIGHT/2, ARENA_WIDTH, ARENA_HEIGHT);

      // Blood
      for (const s of state.bloodStains) {
          ctx.globalAlpha = s.alpha; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.pos.x, s.pos.y, s.size, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Zombies
      for (const z of state.zombies) {
        ctx.save();
        ctx.translate(z.pos.x, z.pos.y);
        ctx.rotate(Math.atan2(state.player.pos.y - z.pos.y, state.player.pos.x - z.pos.x));

        ctx.fillStyle = COLORS.zombieHand;
        ctx.beginPath();
        ctx.arc(z.radius, z.radius/2 + 4, 5, 0, Math.PI * 2); 
        ctx.arc(z.radius, -z.radius/2 - 4, 5, 0, Math.PI * 2); 
        ctx.fill();

        ctx.fillStyle = z.color; ctx.beginPath(); ctx.arc(0, 0, z.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1c1917'; ctx.beginPath(); ctx.arc(z.radius, z.radius/2, 4, 0, Math.PI * 2); ctx.arc(z.radius, -z.radius/2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(z.radius/2, 3, 2, 0, Math.PI * 2); ctx.arc(z.radius/2, -3, 2, 0, Math.PI * 2); ctx.fill();
        
        // HP Bar
        if (z.hp < z.maxHp) {
            ctx.fillStyle = 'red'; ctx.fillRect(-12, -z.radius - 8, 24, 4);
            ctx.fillStyle = 'green'; ctx.fillRect(-12, -z.radius - 8, 24 * (z.hp / z.maxHp), 4);
        }
        ctx.restore();
      }

      // Bullets
      ctx.fillStyle = COLORS.bullet;
      for (const b of state.bullets) { ctx.beginPath(); ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI*2); ctx.fill(); }

      // Player
      ctx.save();
      ctx.translate(state.player.pos.x, state.player.pos.y);
      ctx.rotate(state.player.angle);
      
      ctx.fillStyle = userProfile.isPremium ? '#fcd34d' : COLORS.player; 
      ctx.beginPath(); ctx.arc(0, 0, state.player.radius, 0, Math.PI * 2); ctx.fill();
      if(userProfile.isPremium) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }

      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(10, 8, 5, 0, Math.PI * 2); ctx.arc(10, -8, 5, 0, Math.PI * 2); ctx.fill();

      if (state.player.inventory[state.player.currentSlot]) drawWeapon(ctx, state.player.inventory[state.player.currentSlot]!);
      ctx.restore();
      ctx.restore();
    };

    const gameLoop = () => {
        if (!isGameActive || gameState.current.isGameOver) return;
        
        if (!isPaused) {
            update();
        }
        
        draw();
        
        // Draw Pause Overlay if paused
        if (isPaused) {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0,0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 40px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("OYUN DURAKLATILDI", canvasRef.current!.width/2, canvasRef.current!.height/2);
                ctx.font = '20px sans-serif';
                ctx.fillText("[ESC] veya [P] ile devam et", canvasRef.current!.width/2, canvasRef.current!.height/2 + 40);
                
                // Exit Hint
                ctx.fillText("[O] Oyundan Çık", canvasRef.current!.width/2, canvasRef.current!.height/2 + 80);
            }
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (isGameActive) animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isGameActive, onGameOver, isPaused, settings, userProfile]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full cursor-crosshair" />
      {isGameActive && !isPaused && (
        <>
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none select-none z-10">
                <div className="flex items-center gap-2">
                    <div className="w-48 h-8 bg-gray-900 border-2 border-gray-600 rounded overflow-hidden relative shadow-lg">
                    <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-200" 
                        style={{ width: `${(hudState.health / hudState.maxHealth) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md">
                        {Math.ceil(hudState.health)} / {hudState.maxHealth} HP
                    </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-yellow-400 font-mono text-2xl font-black drop-shadow-md">$ {Math.floor(hudState.score)}</div>
                    <div className="text-red-500 font-mono text-xl font-bold">RAUND {hudState.round}</div>
                </div>
                <div className="text-xs text-blue-300 font-bold">LVL {hudState.level} | ZOMBİ: {hudState.zombiesLeft}</div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold animate-pulse pointer-events-none flex flex-col items-center">
                <span>[ESC] DURDUR</span>
            </div>
            
             <div className="absolute bottom-4 right-4 pointer-events-none select-none z-10">
                <div className="text-right">
                    <div className="text-3xl font-black text-white uppercase mb-1">{hudState.weaponName}</div>
                    <div className={`text-5xl font-black font-mono ${hudState.ammo === 0 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                        {hudState.isReloading ? "RELOADING..." : `${hudState.ammo} / ∞`}
                    </div>
                </div>
            </div>
        </>
      )}
    </>
  );
};

export default GameCanvas;