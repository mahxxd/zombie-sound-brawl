import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Zombie {
  id: number;
  type: 'mindless' | 'mindful';
  x: number;
  y: number;
  health: number;
}

interface GameState {
  playerHealth: number;
  ammo: number;
  peopleSaved: number;
  gameActive: boolean;
  currentSoundFrequency: number;
  zombies: Zombie[];
  battleLog: string[];
  lastDamage: number;
  showKO: boolean;
}

export const ZombieGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerHealth: 250,
    ammo: 15,
    peopleSaved: 0,
    gameActive: true,
    currentSoundFrequency: 0,
    zombies: [],
    battleLog: [],
    lastDamage: 0,
    showKO: false,
  });

  const battleLogRef = useRef<HTMLDivElement>(null);
  const damageTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize zombies
  useEffect(() => {
    initializeGame();
  }, []);

  // Auto-scroll battle log
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [gameState.battleLog]);

  // Zombie movement animation
  useEffect(() => {
    if (!gameState.gameActive) return;

    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        zombies: prev.zombies.map(zombie => ({
          ...zombie,
          x: Math.max(0, Math.min(90, zombie.x + (Math.random() - 0.5) * 8)),
          y: Math.max(0, Math.min(90, zombie.y + (Math.random() - 0.5) * 8)),
        }))
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [gameState.gameActive]);

  const initializeGame = () => {
    const newZombies: Zombie[] = [];
    
    // Create 15 mindless zombies
    for (let i = 0; i < 15; i++) {
      newZombies.push({
        id: i,
        type: 'mindless',
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        health: 1,
      });
    }

    // Create 15 mindful zombies (increased from 10)
    for (let i = 15; i < 30; i++) {
      newZombies.push({
        id: i,
        type: 'mindful',
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        health: 1,
      });
    }

    setGameState({
      playerHealth: 250,
      ammo: 15,
      peopleSaved: 0,
      gameActive: true,
      currentSoundFrequency: 0,
      zombies: newZombies,
      battleLog: ["=== ZOMBIE SURVIVAL ARENA ===", "You encounter 15 mindless and 15 mindful zombies!"],
      lastDamage: 0,
      showKO: false,
    });
  };

  const addLog = (message: string) => {
    setGameState(prev => ({
      ...prev,
      battleLog: [...prev.battleLog, message],
    }));
  };

  const showDamage = (damage: number) => {
    setGameState(prev => ({ ...prev, lastDamage: damage }));
    if (damageTimeoutRef.current) clearTimeout(damageTimeoutRef.current);
    damageTimeoutRef.current = setTimeout(() => {
      setGameState(prev => ({ ...prev, lastDamage: 0 }));
    }, 1000);
  };

  const throwObject = () => {
    const frequency = Math.floor(Math.random() * 4000) + 1000;
    setGameState(prev => ({ ...prev, currentSoundFrequency: frequency }));
    addLog(`🪨 Threw object creating ${frequency}Hz sound!`);
    
    // Remove all mindless zombies
    setTimeout(() => {
      setGameState(prev => {
        const mindlessCount = prev.zombies.filter(z => z.type === 'mindless').length;
        if (mindlessCount > 0) {
          addLog("🧟 Mindless zombies are attracted to the sound and leave!");
        }
        return {
          ...prev,
          zombies: prev.zombies.filter(z => z.type === 'mindful'),
          currentSoundFrequency: 0,
        };
      });
      zombieBehavior();
    }, 1000);
  };

  const cryBaby = () => {
    const frequency = Math.floor(Math.random() * 1000) + 3000;
    setGameState(prev => ({ ...prev, currentSoundFrequency: frequency }));
    addLog(`👶 Baby crying at ${frequency}Hz!`);
    
    setTimeout(() => {
      setGameState(prev => {
        const mindlessCount = prev.zombies.filter(z => z.type === 'mindless').length;
        if (mindlessCount > 0) {
          addLog("🧟 Mindless zombies are attracted to the crying!");
        }
        return {
          ...prev,
          zombies: prev.zombies.filter(z => z.type === 'mindful'),
          currentSoundFrequency: 0,
        };
      });
      zombieBehavior();
    }, 1000);
  };

  const kick = () => {
    setGameState(prev => {
      const mindfulZombies = prev.zombies.filter(z => z.type === 'mindful');
      if (mindfulZombies.length > 0) {
        const targetZombie = mindfulZombies[0];
        addLog("🦵 You kicked a mindful zombie!");
        
        setTimeout(() => zombieBehavior(), 500);
        
        return {
          ...prev,
          zombies: prev.zombies.filter(z => z.id !== targetZombie.id),
        };
      } else {
        addLog("❌ No mindful zombies to kick!");
        return prev;
      }
    });
  };

  const shoot = () => {
    setGameState(prev => {
      if (prev.ammo <= 0) {
        addLog("🚫 Out of ammo!");
        return prev;
      }

      const mindfulZombies = prev.zombies.filter(z => z.type === 'mindful');
      if (mindfulZombies.length > 0) {
        const targetZombie = mindfulZombies[0];
        addLog(`🔫 You shot a mindful zombie! (${prev.ammo - 1} ammo left)`);
        
        setTimeout(() => zombieBehavior(), 500);
        
        return {
          ...prev,
          ammo: prev.ammo - 1,
          zombies: prev.zombies.filter(z => z.id !== targetZombie.id),
        };
      } else {
        addLog("❌ No mindful zombies to shoot!");
        return { ...prev, ammo: prev.ammo - 1 };
      }
    });
  };

  const attemptRun = () => {
    if (gameState.zombies.length === 0) {
      const saved = Math.floor(Math.random() * 11) + 5;
      setGameState(prev => ({
        ...prev,
        peopleSaved: saved,
        gameActive: false,
        showKO: true,
      }));
      addLog(`🏃‍♂️ You successfully escape with ${saved} survivors!`);
      addLog("🎉 K.O! YOU WIN!");
      toast.success("Victory! You survived the zombie apocalypse!");
    } else {
      addLog(`🚫 You can't run yet! There are still ${gameState.zombies.length} zombies left!`);
    }
  };

  const zombieBehavior = () => {
    setGameState(prev => {
      if (prev.zombies.length === 0 || !prev.gameActive) return prev;

      const mindlessCount = prev.zombies.filter(z => z.type === 'mindless').length;
      const mindfulCount = prev.zombies.filter(z => z.type === 'mindful').length;
      
      let totalDamage = 0;
      
      // Increased damage for harder difficulty
      if (mindlessCount > 0 && Math.random() < 0.8) {
        const damage = Math.min(7 * mindlessCount, 25); // Increased from 5 to 7, max from 20 to 25
        totalDamage += damage;
        addLog(`🧟 Mindless zombies swarm you! (-${damage} HP)`);
      }
      
      if (mindfulCount > 0) {
        const damage = Math.min(4 * mindfulCount, 15); // Increased from 2 to 4, max from 10 to 15
        totalDamage += damage;
        addLog(`🧠 Mindful zombies strategically attack! (-${damage} HP)`);
      }

      if (totalDamage > 0) {
        showDamage(totalDamage);
      }

      const newHealth = prev.playerHealth - totalDamage;
      
      if (newHealth <= 0) {
        addLog("💀 YOU DIED!");
        toast.error("Game Over! You have been overwhelmed by zombies!");
        return {
          ...prev,
          playerHealth: 0,
          gameActive: false,
        };
      }

      return {
        ...prev,
        playerHealth: newHealth,
      };
    });
  };

  const clearLog = () => {
    setGameState(prev => ({
      ...prev,
      battleLog: ["=== ZOMBIE SURVIVAL ARENA ===", "Battle log cleared. Ready for action!"],
    }));
  };

  const restartGame = () => {
    initializeGame();
    toast.info("Game restarted! Good luck!");
  };

  const mindlessZombies = gameState.zombies.filter(z => z.type === 'mindless');
  const mindfulZombies = gameState.zombies.filter(z => z.type === 'mindful');

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Arena */}
        <div className="lg:col-span-2">
          <Card className="bg-black border-red-800 p-6">
            <h1 className="text-3xl font-bold text-red-400 mb-4 text-center">
              ZOMBIE SURVIVAL ARENA
            </h1>
            
            {/* Status Bar */}
            <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-green-400 font-bold text-xl">HP: {gameState.playerHealth}/250</span>
                  {gameState.lastDamage > 0 && (
                    <div className="text-red-500 font-bold animate-pulse">
                      -{gameState.lastDamage} HP!
                    </div>
                  )}
                </div>
                <div className="text-blue-400 font-bold text-xl">
                  Ammo: {gameState.ammo}
                </div>
                <div className="text-yellow-400 font-bold text-xl">
                  Saved: {gameState.peopleSaved}
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-red-300">
                  Mindless: {mindlessZombies.length} | Mindful: {mindfulZombies.length}
                </span>
              </div>
              {gameState.currentSoundFrequency > 0 && (
                <div className="text-purple-400 text-center mt-2">
                  🔊 Sound: {gameState.currentSoundFrequency}Hz
                </div>
              )}
            </div>

            {/* Arena */}
            <div className="relative w-full aspect-square bg-black border-4 border-red-800 rounded-lg overflow-hidden">
              {gameState.showKO && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                  <div className="text-6xl font-bold text-yellow-400 animate-pulse">
                    K.O!
                  </div>
                </div>
              )}
              
              {/* Player */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full border-2 border-blue-300 flex items-center justify-center">
                👤
              </div>

              {/* Zombies */}
              {gameState.zombies.map((zombie) => (
                <div
                  key={zombie.id}
                  className={`absolute w-6 h-6 rounded-full transition-all duration-500 ${
                    zombie.type === 'mindless' 
                      ? 'bg-green-600 border-green-400' 
                      : 'bg-red-600 border-red-400'
                  } border-2 flex items-center justify-center text-xs animate-pulse`}
                  style={{
                    left: `${zombie.x}%`,
                    top: `${zombie.y}%`,
                  }}
                >
                  {zombie.type === 'mindless' ? (
                    '🧟'
                  ) : (
                    <img 
                      src="/lovable-uploads/b6100da4-a17d-44c1-914a-8fefaa2651fa.png" 
                      alt="Mindful Zombie"
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button 
                onClick={throwObject}
                disabled={!gameState.gameActive}
                className="bg-orange-600 hover:bg-orange-700"
              >
                🪨 Throw Object
              </Button>
              <Button 
                onClick={cryBaby}
                disabled={!gameState.gameActive}
                className="bg-pink-600 hover:bg-pink-700"
              >
                👶 Cry Baby
              </Button>
              <Button 
                onClick={kick}
                disabled={!gameState.gameActive}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                🦵 Kick
              </Button>
              <Button 
                onClick={shoot}
                disabled={!gameState.gameActive || gameState.ammo <= 0}
                className="bg-red-600 hover:bg-red-700"
              >
                🔫 Shoot
              </Button>
              <Button 
                onClick={attemptRun}
                disabled={!gameState.gameActive}
                className="bg-green-600 hover:bg-green-700"
              >
                🏃‍♂️ Run
              </Button>
            </div>

            <div className="mt-4 flex gap-3">
              <Button 
                onClick={restartGame}
                className="bg-purple-600 hover:bg-purple-700"
              >
                🔄 Restart Game
              </Button>
            </div>
          </Card>
        </div>

        {/* Battle Log */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-gray-700 p-4 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-400">Battle Log</h2>
              <Button 
                onClick={clearLog}
                size="sm"
                className="bg-gray-600 hover:bg-gray-700"
              >
                Clear Log
              </Button>
            </div>
            <div 
              ref={battleLogRef}
              className="h-96 overflow-y-auto bg-black p-3 rounded border border-gray-600 font-mono text-sm space-y-1"
            >
              {gameState.battleLog.map((log, index) => (
                <div key={index} className="text-green-300">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};