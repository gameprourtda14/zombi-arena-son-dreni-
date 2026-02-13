import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStats, UserProfile, AppSettings, Mission, Rarity, Skin, WeaponType } from './types';
import { generateBattleReport } from './services/geminiService';
import { ADMIN_CODE, BASE_WEAPONS, SKIN_DATABASE, MISSIONS, RARITY_COLORS } from './constants';

// --- Sub Components ---

interface LoadoutPanelProps {
    userProfile: UserProfile;
    onEquip: (id: string, type: WeaponType) => void;
    onUnlock: (id: string, price: number) => void;
}

const LoadoutPanel: React.FC<LoadoutPanelProps> = ({ userProfile, onEquip, onUnlock }) => {
      const [filter, setFilter] = useState<'all' | 'rifle' | 'pistol' | 'knife' | 'sniper' | 'shotgun'>('all');
      
      const filtered = BASE_WEAPONS.filter(w => filter === 'all' || w.type === filter);

      return (
          <div className="h-[600px] flex flex-col">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {['all', 'rifle', 'shotgun', 'sniper', 'pistol', 'knife'].map(t => (
                      <button key={t} onClick={() => setFilter(t as any)} className={`px-4 py-2 rounded font-bold uppercase ${filter === t ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-gray-300'}`}>{t}</button>
                  ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 flex-1">
                  {filtered.map(w => {
                      const unlocked = userProfile.unlockedWeapons.includes(w.id);
                      const isEquipped = userProfile.equippedLoadout.main === w.id || 
                                         userProfile.equippedLoadout.pistol === w.id || 
                                         userProfile.equippedLoadout.melee === w.id;
                      
                      return (
                        <div key={w.id} className={`p-4 rounded border flex flex-col justify-between ${isEquipped ? 'border-yellow-400 bg-yellow-900/10' : unlocked ? 'border-green-600 bg-green-900/10' : 'border-gray-700 bg-gray-800'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white">{w.name}</h3>
                                    {isEquipped && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">KUŞANILDI</span>}
                                </div>
                                <div className="grid grid-cols-2 text-xs gap-1 text-gray-500 mb-4">
                                    <div>Hasar: {w.damage}</div>
                                    <div>Seri: {Math.round(60/w.fireRate)}/s</div>
                                    <div>Şarjör: {w.magSize}</div>
                                </div>
                            </div>
                            
                            {unlocked ? (
                                <button 
                                  onClick={() => onEquip(w.id, w.type)}
                                  className={`w-full py-2 rounded font-bold text-sm ${isEquipped ? 'bg-gray-700 text-gray-400 cursor-default' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                                  disabled={isEquipped}
                                >
                                    {isEquipped ? "KUŞANILDI" : "KUŞAN"}
                                </button>
                            ) : (
                                <button 
                                  onClick={() => onUnlock(w.id, w.price)}
                                  disabled={userProfile.totalMoney < w.price}
                                  className={`w-full py-2 rounded font-bold text-sm ${userProfile.totalMoney >= w.price ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-gray-700 text-gray-500'}`}
                                >
                                    KİLİDİ AÇ ($ {w.price})
                                </button>
                            )}
                        </div>
                      )
                  })}
              </div>
          </div>
      );
};

interface SkinsPanelProps {
    userProfile: UserProfile;
    onEquipSkin: (weaponId: string, skinId: string) => void;
    onOpenCase: () => void;
    openingCase: boolean;
    wonSkin: Skin | null;
}

const SkinsPanel: React.FC<SkinsPanelProps> = ({ userProfile, onEquipSkin, onOpenCase, openingCase, wonSkin }) => {
    const ownedSkins = SKIN_DATABASE.filter(s => userProfile.unlockedSkins.includes(s.id));
    
    return (
        <div className="h-[600px] flex flex-col">
            <div className="flex justify-between mb-4">
                <div className="text-xl font-bold text-white">ENVANTER ({ownedSkins.length})</div>
                <div className="flex gap-2">
                    <div className="bg-gray-800 px-4 py-2 rounded border border-gray-600">
                        <span className="text-yellow-400 font-bold">{userProfile.cases}</span> KASA
                    </div>
                    <button onClick={onOpenCase} disabled={userProfile.cases <= 0 || openingCase} className={`px-6 py-2 rounded font-bold ${userProfile.cases > 0 && !openingCase ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                        {openingCase ? "AÇILIYOR..." : "KASA AÇ"}
                    </button>
                </div>
            </div>

            {/* Case Opening Animation Area */}
            {openingCase && (
                <div className="mb-6 p-8 bg-gray-900 border border-purple-500 rounded flex justify-center items-center h-40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-900/30 to-transparent animate-pulse" />
                    <div className="text-3xl font-black text-white animate-bounce">???</div>
                </div>
            )}
            
            {wonSkin && !openingCase && (
                <div className="mb-6 p-4 bg-gray-900 border-2 rounded flex flex-col items-center animate-in zoom-in duration-300" style={{ borderColor: RARITY_COLORS[wonSkin.rarity] }}>
                    <div className="text-gray-400 text-sm mb-1 uppercase tracking-widest">KAZANDIN!</div>
                    <div className="text-2xl font-black mb-1" style={{ color: RARITY_COLORS[wonSkin.rarity] }}>{wonSkin.name}</div>
                    <div className="text-xs text-gray-500">{wonSkin.rarity.toUpperCase().replace('_', ' ')}</div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto pr-2 flex-1">
                {ownedSkins.map(s => {
                    const isEquipped = userProfile.equippedLoadout.skins[s.weaponId] === s.id;
                    return (
                        <div key={s.id} className={`p-2 rounded border flex flex-col items-center bg-gray-800 relative group transition-all hover:scale-105`} style={{ borderColor: isEquipped ? '#fff' : RARITY_COLORS[s.rarity] }}>
                            <div className="w-full h-20 bg-black/40 mb-2 rounded flex items-center justify-center">
                                {/* Simple Weapon Silhouette with skin color */}
                                <div className="w-16 h-8 rounded" style={{ backgroundColor: s.color }}></div>
                            </div>
                            <div className="text-xs text-center font-bold text-white truncate w-full mb-1">{s.name}</div>
                            <div className="text-[10px] text-gray-500 uppercase mb-2">{s.rarity.replace('_', ' ')}</div>
                            
                            {isEquipped ? (
                                <div className="w-full py-1 text-center bg-white text-black text-[10px] font-bold rounded">KUŞANILDI</div>
                            ) : (
                                <button onClick={() => onEquipSkin(s.weaponId, s.id)} className="w-full py-1 text-center bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold rounded">KUŞAN</button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

interface MissionsPanelProps {
    userProfile: UserProfile;
    onClaim: (id: number) => void;
}

const MissionsPanel: React.FC<MissionsPanelProps> = ({ userProfile, onClaim }) => {
    return (
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2">
              {MISSIONS.map(m => {
                  const progress = userProfile.missions[m.id] || 0;
                  const isCompleted = progress >= m.target;
                  const isClaimed = userProfile.claimedMissions.includes(m.id);
                  const percent = Math.min(100, Math.floor((progress / m.target) * 100));

                  return (
                      <div key={m.id} className="bg-gray-800 border border-gray-700 p-4 rounded flex justify-between items-center">
                          <div className="flex-1">
                              <h4 className="font-bold text-white mb-1">{m.description}</h4>
                              <div className="w-full max-w-md h-2 bg-gray-900 rounded overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${percent}%` }}></div>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">{progress} / {m.target}</div>
                          </div>
                          <div className="flex flex-col items-end min-w-[100px]">
                               <div className="text-sm font-bold text-yellow-400 mb-2">
                                   ÖDÜL: {m.rewardType === 'money' ? `$${m.rewardValue}` : `${m.rewardValue} KASA`}
                               </div>
                               {isClaimed ? (
                                   <button disabled className="px-4 py-1 bg-gray-700 text-gray-500 text-xs font-bold rounded">ALINDI</button>
                               ) : (
                                   <button 
                                    onClick={() => onClaim(m.id)}
                                    disabled={!isCompleted}
                                    className={`px-4 py-1 text-xs font-bold rounded ${isCompleted ? 'bg-green-600 hover:bg-green-500 text-white animate-pulse' : 'bg-gray-700 text-gray-500'}`}
                                   >
                                       {isCompleted ? "ÖDÜLÜ AL" : "TAMAMLANMADI"}
                                   </button>
                               )}
                          </div>
                      </div>
                  )
              })}
          </div>
      )
}

const App: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'game' | 'gameover'>('menu');
  const [menuTab, setMenuTab] = useState<'play' | 'loadout' | 'skins' | 'missions' | 'stats' | 'premium' | 'settings'>('play');
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: 'Oyuncu',
    totalMoney: 0, 
    level: 1,
    currentXp: 0,
    xpForNextLevel: 100,
    isPremium: false,
    unlockedWeapons: ['glock', 'knife'], 
    unlockedSkins: ['skin_glock_default', 'skin_knife_default'],
    cases: 0,
    equippedLoadout: {
        main: null,
        pistol: 'glock',
        melee: 'knife',
        skins: {
            'glock': 'skin_glock_default',
            'knife': 'skin_knife_default'
        }
    },
    missions: {},
    claimedMissions: [],
    stats: {
      totalKills: 0,
      totalGames: 0,
      highestRound: 0
    }
  });

  // Persistence: Load
  useEffect(() => {
    try {
        const saved = localStorage.getItem('zombie_arena_profile_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            setUserProfile(prev => ({...prev, ...parsed}));
        }
    } catch(e) {
        console.error("Save load error", e);
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    localStorage.setItem('zombie_arena_profile_v2', JSON.stringify(userProfile));
  }, [userProfile]);

  const [settings, setSettings] = useState<AppSettings>({
    graphicsQuality: 'high',
    isAdmin: false
  });

  const [adminInput, setAdminInput] = useState("");
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [battleReport, setBattleReport] = useState<string>("");
  const [gameId, setGameId] = useState(0);
  const [openingCase, setOpeningCase] = useState(false);
  const [wonSkin, setWonSkin] = useState<Skin | null>(null);

  // Initialize Missions if empty
  useEffect(() => {
    const activeMissions = {...userProfile.missions};
    let changed = false;
    MISSIONS.forEach(m => {
        if (activeMissions[m.id] === undefined) {
            activeMissions[m.id] = 0;
            changed = true;
        }
    });
    if (changed) setUserProfile(p => ({...p, missions: activeMissions}));
  }, []);

  const startGame = () => {
    if(userProfile.username.trim() === '') { alert("Lütfen bir isim giriniz!"); return; }
    setGameId(prev => prev + 1);
    setBattleReport("");
    setLastStats(null);
    setScreen('game');
  };

  const handleGameOver = (stats: GameStats) => {
    // Mission Progress Logic
    const updatedMissions = { ...userProfile.missions };
    MISSIONS.forEach(m => {
        // Only update if not claimed yet? Or keep updating for stats? 
        // Keeping updating allows user to see "500/50" even if target is 50.
        
        if (m.description.includes("Zombi Öldür")) {
            updatedMissions[m.id] = (updatedMissions[m.id] || 0) + stats.kills;
        } else if (m.description.includes("Mermi Harca")) {
            updatedMissions[m.id] = (updatedMissions[m.id] || 0) + stats.shotsFired;
        } else if (m.description.includes("Hayatta Kal")) {
            // Count full rounds survived
            updatedMissions[m.id] = (updatedMissions[m.id] || 0) + Math.max(0, Math.floor(stats.timeSurvived / 60)); // Approximate rounds logic
        } else if (m.description.includes("Hiç Hasar Almadan")) {
            // Specific logic for no damage round 1
            if (stats.damageTaken === 0 && stats.timeSurvived > 60) {
                 updatedMissions[m.id] = 1;
            }
        }
        
        // Cap progress visual only when displaying, but store actual
        if (updatedMissions[m.id] > m.target) updatedMissions[m.id] = m.target;
    });

    const earnedMoney = stats.moneyEarned;
    let newXp = userProfile.currentXp + stats.xpEarned;
    let newLevel = userProfile.level;
    let nextXp = userProfile.xpForNextLevel;

    while (newXp >= nextXp) {
        newLevel++;
        newXp -= nextXp;
        nextXp = Math.floor(100 * Math.pow(1.5, newLevel - 1));
    }

    // Set new profile state (this triggers Save effect)
    setUserProfile(prev => ({
        ...prev,
        totalMoney: prev.totalMoney + earnedMoney,
        level: newLevel,
        currentXp: newXp,
        xpForNextLevel: nextXp,
        missions: updatedMissions,
        stats: {
            totalKills: prev.stats.totalKills + stats.kills,
            totalGames: prev.stats.totalGames + 1,
            highestRound: Math.max(prev.stats.highestRound, Math.floor(stats.timeSurvived / 60) + 1)
        }
    }));

    setLastStats(stats);
    setScreen('gameover');
    generateBattleReport(stats).then(report => { setBattleReport(report); });
  };

  const checkAdminCode = () => {
      if (adminInput === ADMIN_CODE) {
          setSettings(prev => ({ ...prev, isAdmin: true }));
          setUserProfile(prev => ({ ...prev, isPremium: true, totalMoney: 9999999, cases: 50 })); 
          alert("ADMİN YETKİLERİ AKTİF EDİLDİ!");
          setAdminInput("");
      } else { alert("Hatalı kod!"); }
  };

  const buyPremium = () => {
      if (userProfile.isPremium) return;
      if (window.confirm("100 TL karşılığında Premium üyelik almak istiyor musunuz?")) {
          setUserProfile(prev => ({ ...prev, isPremium: true, totalMoney: prev.totalMoney + 100000 }));
          alert("Satın alım başarılı! Premium üyesiniz. 100.000$ ve 1000 HP hesabınıza tanımlandı.");
      }
  };

  const unlockWeapon = (weaponId: string, price: number) => {
      if (userProfile.unlockedWeapons.includes(weaponId)) return;
      if (userProfile.totalMoney >= price) {
          setUserProfile(prev => ({
              ...prev,
              totalMoney: prev.totalMoney - price,
              unlockedWeapons: [...prev.unlockedWeapons, weaponId],
              // Add default skin
              unlockedSkins: [...prev.unlockedSkins, `skin_${weaponId}_default`],
              equippedLoadout: {
                  ...prev.equippedLoadout,
                  skins: { ...prev.equippedLoadout.skins, [weaponId]: `skin_${weaponId}_default` }
              }
          }));
      }
  };

  const equipWeapon = (weaponId: string, type: WeaponType) => {
      setUserProfile(prev => {
          const newLoadout = { ...prev.equippedLoadout };
          if (type === 'pistol') newLoadout.pistol = weaponId;
          else if (type === 'knife') newLoadout.melee = weaponId;
          else newLoadout.main = weaponId; 
          return { ...prev, equippedLoadout: newLoadout };
      });
  };

  const equipSkin = (weaponId: string, skinId: string) => {
      setUserProfile(prev => ({
          ...prev,
          equippedLoadout: {
              ...prev.equippedLoadout,
              skins: { ...prev.equippedLoadout.skins, [weaponId]: skinId }
          }
      }));
  };

  const claimMission = (missionId: number) => {
      const mission = MISSIONS.find(m => m.id === missionId);
      if (!mission) return;
      if (userProfile.claimedMissions.includes(missionId)) return;
      if ((userProfile.missions[missionId] || 0) < mission.target) return;

      setUserProfile(prev => ({
          ...prev,
          totalMoney: mission.rewardType === 'money' ? prev.totalMoney + mission.rewardValue : prev.totalMoney,
          cases: mission.rewardType === 'case' ? prev.cases + mission.rewardValue : prev.cases,
          claimedMissions: [...prev.claimedMissions, missionId]
      }));
  };

  const openCase = () => {
      if (userProfile.cases <= 0 || openingCase) return;
      setOpeningCase(true);
      setWonSkin(null);

      setTimeout(() => {
        // RNG Logic
        const rand = Math.random();
        let rarity: Rarity = 'standard';
        if (rand > 0.98) rarity = 'gold'; // 2%
        else if (rand > 0.90) rarity = 'ultra_rare'; // 8%
        else if (rand > 0.75) rarity = 'legendary'; // 15%
        else if (rand > 0.50) rarity = 'rare'; // 25%
        
        // Filter skins by rarity
        const potentialSkins = SKIN_DATABASE.filter(s => s.rarity === rarity);
        const randomSkin = potentialSkins[Math.floor(Math.random() * potentialSkins.length)];
        
        setWonSkin(randomSkin);
        setOpeningCase(false);
        
        // Add to inventory if not exists
        setUserProfile(prev => {
            const hasSkin = prev.unlockedSkins.includes(randomSkin.id);
            return {
                ...prev,
                cases: prev.cases - 1,
                unlockedSkins: hasSkin ? prev.unlockedSkins : [...prev.unlockedSkins, randomSkin.id],
                totalMoney: hasSkin ? prev.totalMoney + 500 : prev.totalMoney // Duplicate reward
            }
        });

      }, 2000); // Animation delay
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0a] overflow-hidden relative font-sans text-white select-none">
      
      {screen === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-green-950 to-black opacity-80" />
            
            <div className="relative z-10 w-full max-w-7xl h-[95vh] flex shadow-2xl rounded-2xl overflow-hidden border border-gray-800 bg-[#121212]">
                <div className="w-64 bg-[#0f0f0f] border-r border-gray-800 flex flex-col">
                    <div className="p-6 border-b border-gray-800">
                        <h1 className="text-2xl font-black text-red-600 tracking-tighter italic">ZOMBİ<br/><span className="text-white">ARENASI</span></h1>
                    </div>
                    <nav className="flex-1 flex flex-col p-4 gap-2 text-sm">
                        <button onClick={() => setMenuTab('play')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'play' ? 'bg-red-900/30 text-red-500 border-l-4 border-red-500' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>SAVAŞ</button>
                        <button onClick={() => setMenuTab('loadout')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'loadout' ? 'bg-blue-900/30 text-blue-500 border-l-4 border-blue-500' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>SİLAHLAR</button>
                        <button onClick={() => setMenuTab('skins')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'skins' ? 'bg-purple-900/30 text-purple-500 border-l-4 border-purple-500' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>SKINLER & KASA</button>
                        <button onClick={() => setMenuTab('missions')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'missions' ? 'bg-green-900/30 text-green-500 border-l-4 border-green-500' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>GÖREVLER</button>
                        <button onClick={() => setMenuTab('stats')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'stats' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>PROFİL</button>
                        <button onClick={() => setMenuTab('premium')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'premium' ? 'bg-yellow-900/30 text-yellow-500 border-l-4 border-yellow-500' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>VIP</button>
                        <div className="flex-1" />
                        <button onClick={() => setMenuTab('settings')} className={`p-3 text-left font-bold rounded transition-all ${menuTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-400'}`}>AYARLAR</button>
                    </nav>
                </div>

                <div className="flex-1 p-8 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                        <h2 className="text-3xl font-black text-white uppercase tracking-wide">
                           {menuTab === 'play' && "SAVAŞ HAZIRLIĞI"}
                           {menuTab === 'loadout' && "SİLAH MARKETİ"}
                           {menuTab === 'skins' && "KOLEKSİYON"}
                           {menuTab === 'missions' && "GÖREV LİSTESİ"}
                           {menuTab === 'stats' && "PERSONEL KAYDI"}
                           {menuTab === 'premium' && "VIP MAĞAZA"}
                           {menuTab === 'settings' && "AYARLAR"}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-[10px] text-gray-400">BAKİYE</div>
                                <div className="text-xl font-mono text-green-400 font-bold">$ {userProfile.totalMoney}</div>
                            </div>
                            {userProfile.isPremium && <div className="px-3 py-1 bg-yellow-600 text-black text-xs font-bold rounded">VIP</div>}
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {menuTab === 'play' && (
                             <div className="space-y-6 max-w-2xl mx-auto mt-10">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">KOD ADINIZ</label>
                                    <input type="text" value={userProfile.username} onChange={(e) => setUserProfile({...userProfile, username: e.target.value})} className="w-full bg-gray-800 border border-gray-600 p-4 text-xl text-white rounded focus:border-red-600 outline-none font-mono tracking-widest uppercase" placeholder="İSİM GİRİNİZ..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/40 p-4 rounded border border-gray-700">
                                        <div className="text-gray-400 text-xs">RÜTBE</div>
                                        <div className="text-white font-bold text-2xl">LVL {userProfile.level}</div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded border border-gray-700">
                                         <div className="text-gray-400 text-xs">AÇIK KASA</div>
                                         <div className="text-purple-400 font-bold text-2xl">{userProfile.cases}</div>
                                    </div>
                                </div>
                                <button onClick={startGame} className="w-full py-6 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-3xl italic tracking-tighter rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.6)] transform hover:scale-[1.02] transition-all border-b-4 border-red-900">SAVAŞA KATIL</button>
                             </div>
                        )}
                        {menuTab === 'loadout' && <LoadoutPanel userProfile={userProfile} onEquip={equipWeapon} onUnlock={unlockWeapon} />}
                        {menuTab === 'skins' && <SkinsPanel userProfile={userProfile} onEquipSkin={equipSkin} onOpenCase={openCase} openingCase={openingCase} wonSkin={wonSkin} />}
                        {menuTab === 'missions' && <MissionsPanel userProfile={userProfile} onClaim={claimMission} />}
                        {menuTab === 'stats' && (
                            <div className="space-y-4">
                                <div className="bg-gray-800 p-4 rounded flex justify-between"><span className="text-gray-400">Toplam Leş</span><span className="text-yellow-400 font-mono text-xl">{userProfile.stats.totalKills}</span></div>
                                <div className="bg-gray-800 p-4 rounded flex justify-between"><span className="text-gray-400">Oynanan Maç</span><span className="text-white font-mono text-xl">{userProfile.stats.totalGames}</span></div>
                                <div className="bg-gray-800 p-4 rounded flex justify-between"><span className="text-gray-400">En Yüksek Raund</span><span className="text-red-400 font-mono text-xl">{userProfile.stats.highestRound}</span></div>
                                <div className="bg-gray-800 p-4 rounded flex justify-between"><span className="text-gray-400">Mevcut XP</span><span className="text-blue-400 font-mono text-xl">{userProfile.currentXp} / {userProfile.xpForNextLevel}</span></div>
                            </div>
                        )}
                        {menuTab === 'settings' && (
                             <div className="space-y-6">
                                <div>
                                    <h3 className="text-white font-bold mb-2">GRAFİK AYARLARI</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSettings(p => ({...p, graphicsQuality: 'low'}))} className={`flex-1 py-2 rounded border ${settings.graphicsQuality === 'low' ? 'bg-red-600 border-red-600 text-white' : 'border-gray-600 text-gray-400'}`}>DÜŞÜK</button>
                                        <button onClick={() => setSettings(p => ({...p, graphicsQuality: 'high'}))} className={`flex-1 py-2 rounded border ${settings.graphicsQuality === 'high' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 text-gray-400'}`}>YÜKSEK</button>
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 pt-6">
                                    <h3 className="text-red-500 font-bold mb-2">GİZLİ ERİŞİM (ADMİN)</h3>
                                    <div className="flex gap-2">
                                        <input type="password" value={adminInput} onChange={(e) => setAdminInput(e.target.value)} placeholder="Erişim Kodu..." className="flex-1 bg-gray-900 border border-gray-700 p-2 text-white rounded outline-none focus:border-red-500"/>
                                        <button onClick={checkAdminCode} className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded">GİRİŞ</button>
                                    </div>
                                </div>
                             </div>
                        )}
                        {menuTab === 'premium' && (
                            <div className="text-center space-y-6 py-4">
                                <div className="text-5xl">👑</div>
                                <h2 className="text-3xl font-bold text-yellow-400">PREMIUM ÜYELİK</h2>
                                <ul className="text-left text-gray-300 space-y-2 bg-gray-900/50 p-6 rounded mx-auto max-w-sm">
                                    <li>✅ Başlangıçta 1000 CAN (Normal: 100)</li>
                                    <li>✅ Anında 100.000$ Hediye</li>
                                    <li>✅ Altın Çerçeve</li>
                                    <li>✅ Liderlik Tablosunda Öne Çıkma</li>
                                </ul>
                                {userProfile.isPremium ? (
                                    <button disabled className="w-full py-3 bg-gray-700 text-yellow-400 font-bold rounded cursor-default border border-yellow-600">ZATEN PREMİUM ÜYESİNİZ</button>
                                ) : (
                                    <button onClick={buyPremium} className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-black text-xl rounded shadow-[0_0_20px_rgba(234,179,8,0.4)]">SATIN AL (100 TL)</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {screen === 'game' && (
          <GameCanvas 
            key={gameId} 
            onGameOver={handleGameOver} 
            isGameActive={true}
            userProfile={userProfile}
            settings={settings}
          />
      )}

      {screen === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center z-50 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md" />
           <div className="relative z-10 bg-black border-4 border-red-900 p-8 rounded-none max-w-4xl w-full mx-4 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h2 className="text-6xl font-black text-red-600 mb-2 italic tracking-tighter">ÖLDÜN</h2>
                <p className="text-gray-400 mb-8 uppercase tracking-widest text-sm">GÖREV SONLANDI</p>
                {lastStats && (
                  <div className="space-y-3 font-mono text-lg border-l-2 border-red-800 pl-4 mb-8">
                      <div className="flex justify-between"><span className="text-gray-500">SÜRE</span> <span className="text-white">{lastStats.timeSurvived.toFixed(1)}s</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">LEŞ</span> <span className="text-yellow-500">{lastStats.kills}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">KAZANÇ</span> <span className="text-green-500">+$ {lastStats.moneyEarned}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">LEVEL</span> <span className="text-blue-500">{lastStats.levelReached}</span></div>
                  </div>
                )}
                <button onClick={() => setScreen('menu')} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold mb-3 rounded">ANA MENÜYE DÖN</button>
                <button onClick={startGame} className="w-full py-4 bg-white text-black font-black hover:bg-gray-200 transition-colors rounded uppercase tracking-wider">TEKRAR DENE</button>
              </div>
              <div className="flex-1 bg-gray-900 p-6 rounded border border-gray-800 flex flex-col">
                  <h3 className="text-red-500 font-bold mb-4 border-b border-gray-800 pb-2">ASKERİ OTOPSİ RAPORU</h3>
                  <div className="flex-1 overflow-y-auto text-sm text-gray-300 italic leading-relaxed">
                       {battleReport ? battleReport : <div className="flex items-center justify-center h-full gap-2 text-gray-500 animate-pulse">Generating Report...</div>}
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;