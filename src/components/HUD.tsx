import React, { useEffect, useState, useRef } from 'react';
import { Game } from '../game/Game';
import { Ability } from '../game/types';
import {
  Shield, Sword, RotateCw, Zap, Crown, FlaskConical, Ghost,
  Cloud, Flame, Snowflake, Waves, MoveUpRight, Star, Target,
  ChevronLast, RefreshCw, Bomb, CloudRain,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface HUDProps {
  game: Game;
  onGameOver: () => void;
  onVictory: () => void;
}

// ─── Icon map (small, flat) ─────────────────────────────────────────────────
const IconMap: Record<string, React.ReactNode> = {
  Shield:     <Shield    size={14} />,
  Sword:      <Sword     size={14} />,
  RotateCw:   <RotateCw  size={14} />,
  Zap:        <Zap       size={14} />,
  Crown:      <Crown     size={14} />,
  FlaskConical:<FlaskConical size={14}/>,
  Ghost:      <Ghost     size={14} />,
  Cloud:      <Cloud     size={14} />,
  Flame:      <Flame     size={14} />,
  Snowflake:  <Snowflake size={14} />,
  Waves:      <Waves     size={14} />,
  MoveUpRight:<MoveUpRight size={14}/>,
  Star:       <Star      size={14} />,
  Target:     <Target    size={14} />,
  ChevronLast:<ChevronLast size={14}/>,
  RefreshCw:  <RefreshCw size={14} />,
  Bomb:       <Bomb      size={14} />,
  CloudRain:  <CloudRain size={14} />,
};

// ─── Class accent colors ────────────────────────────────────────────────────
const CLASS_COLOR: Record<string, string> = {
  knight: '#D4A017',
  rogue:  '#A855F7',
  mage:   '#3B82F6',
  archer: '#22C55E',
};

// ─── Simple flat stat bar ────────────────────────────────────────────────────
function StatBar({
  value, max, color, label, width = 140,
}: {
  value: number; max: number; color: string; label: string; width?: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 24,
        fontSize: 9,
        fontFamily: '"Pixelify Sans", monospace',
        color: color,
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{
        width,
        height: 6,
        background: '#111827',
        border: '1px solid #374151',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          transition: 'width 80ms ease',
        }} />
      </div>
      <div style={{ fontSize: 9, color: '#6B7280', minWidth: 32, textAlign: 'right' }}>
        {Math.ceil(value)}/{max}
      </div>
    </div>
  );
}

// ─── Single ability slot ────────────────────────────────────────────────────
function AbilitySlot({
  ab, index, isRebindTarget, onRebind, classColor,
}: {
  ab: Ability; index: number; isRebindTarget: boolean;
  onRebind: (i: number) => void; classColor: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cooldownPct = ab.cooldown > 0 ? ab.currentCooldown / ab.cooldown : 0;
  const onCooldown  = ab.currentCooldown > 0;

  const borderColor = isRebindTarget
    ? '#D4A017'
    : !ab.isUnlocked
    ? '#374151'
    : onCooldown
    ? '#4B5563'
    : classColor;

  const bg = isRebindTarget
    ? 'rgba(212,160,23,0.12)'
    : !ab.isUnlocked
    ? '#111827'
    : onCooldown
    ? '#161e2b'
    : '#1F2937';

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => { if (ab.isUnlocked) onRebind(index); }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: 48,
          height: 52,
          background: bg,
          border: `1px solid ${borderColor}`,
          cursor: ab.isUnlocked ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 4px 5px',
          position: 'relative',
          opacity: !ab.isUnlocked ? 0.4 : 1,
          overflow: 'hidden',
          transition: 'border-color 80ms ease, background 80ms ease',
          pointerEvents: 'auto',
        }}
      >
        {/* Cooldown fill overlay */}
        {ab.isUnlocked && onCooldown && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${cooldownPct * 100}%`,
            background: 'rgba(0,0,0,0.55)',
            transition: 'height 200ms linear',
          }} />
        )}

        {/* Icon */}
        <div style={{
          color: !ab.isUnlocked ? '#4B5563' : onCooldown ? '#6B7280' : classColor,
          position: 'relative',
          zIndex: 1,
        }}>
          {IconMap[ab.icon] ?? <Zap size={14} />}
        </div>

        {/* Cooldown number or unlock level */}
        <div style={{
          fontSize: 11,
          fontFamily: '"Pixelify Sans", monospace',
          color: !ab.isUnlocked ? '#4B5563' : onCooldown ? '#9CA3AF' : '#E5E7EB',
          position: 'relative',
          zIndex: 1,
          lineHeight: 1,
        }}>
          {ab.isUnlocked
            ? (onCooldown ? Math.ceil(ab.currentCooldown) : '·')
            : `L${ab.unlockLevel}`}
        </div>

        {/* Keybind */}
        <div style={{
          fontSize: 8,
          fontFamily: '"IBM Plex Mono", monospace',
          color: '#4B5563',
          position: 'relative',
          zIndex: 1,
          letterSpacing: '0.04em',
        }}>
          {ab.keybind}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && ab.isUnlocked && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#1F2937',
          border: '1px solid #374151',
          padding: '10px 12px',
          width: 180,
          pointerEvents: 'none',
          zIndex: 100,
        }}>
          <div style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 11,
            color: classColor,
            marginBottom: 4,
            letterSpacing: '0.04em',
          }}>
            {ab.name}
          </div>
          <div style={{ fontSize: 9, color: '#9CA3AF', lineHeight: 1.5, marginBottom: 6 }}>
            {ab.description}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 9,
            color: '#6B7280',
            borderTop: '1px solid #374151',
            paddingTop: 6,
            marginTop: 4,
          }}>
            <span>CD: {ab.cooldown}s</span>
            <span style={{ color: '#D4A017' }}>[{ab.keybind}]</span>
          </div>
          <div style={{ fontSize: 8, color: '#4B5563', marginTop: 4 }}>
            click to rebind
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HUD root ───────────────────────────────────────────────────────────────
export function HUD({ game, onGameOver }: HUDProps) {
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stats, setStats] = useState({
    health:          100,
    maxHealth:       100,
    energy:          100,  // 0-100, derived from cooldowns
    score:           0,
    floor:           1,
    level:           1,
    experience:      0,
    nextLevelXp:     100,
    playerClass:     'knight',
    notification:    '',
    roomState:       'clearing' as 'clearing' | 'dropped' | 'unlocked',
    enemiesRemaining: 0,
    abilities:       [] as Ability[],
    rebindTarget:    null as number | null,
    bossHealth:      0,
    bossMaxHealth:   0,
    isBossFloor:     false,
    visibleNotif:    '',
  });

  useEffect(() => {
    let frameId: number;
    let lastNotif = '';

    const update = () => {
      const unlocked = game.abilities.filter(a => a.isUnlocked);
      const maxCdFrac = unlocked.length
        ? Math.max(...unlocked.map(a => a.cooldown > 0 ? a.currentCooldown / a.cooldown : 0))
        : 0;
      const energy = Math.round((1 - maxCdFrac) * 100);

      const isBossFloor = [11, 21, 31].includes(game.floor);
      const boss = isBossFloor ? game.enemies?.find((e: any) => e.type === 'boss') : undefined;

      // Handle notifications with auto-clear
      if (game.notification && game.notification !== lastNotif) {
        lastNotif = game.notification;
        if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
        setStats(prev => ({ ...prev, visibleNotif: game.notification }));
        notifTimeoutRef.current = setTimeout(() => {
          setStats(prev => ({ ...prev, visibleNotif: '' }));
        }, 2200);
      }

      setStats(prev => ({
        ...prev,
        health:          game.playerHealth,
        maxHealth:       game.playerMaxHealth,
        energy,
        score:           game.score,
        floor:           game.floor,
        level:           game.level,
        experience:      game.experience,
        nextLevelXp:     game.nextLevelXp,
        playerClass:     game.playerClass,
        notification:    game.notification,
        roomState:       game.roomState,
        enemiesRemaining: game.totalEnemiesInRoom - game.enemiesDefeated,
        abilities:       [...game.abilities],
        rebindTarget:    game.rebindTarget,
        isBossFloor,
        bossHealth:      boss ? (boss as any).health    : 0,
        bossMaxHealth:   boss ? (boss as any).maxHealth : 0,
      }));

      if (game.playerHealth <= 0) {
        setTimeout(onGameOver, 1400);
        return;
      }
      if (game.towerCompleted) {
        setTimeout(onVictory, 500);
        return;
      }
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frameId);
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, [game, onGameOver, onVictory]);

  const classColor = CLASS_COLOR[stats.playerClass] ?? '#D4A017';
  const hasAbilities = stats.abilities.some(a => a.isUnlocked);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ fontFamily: '"IBM Plex Mono", monospace' }}
    >
      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 14px',
        background: 'rgba(17,24,39,0.88)',
        borderBottom: '1px solid #374151',
        zIndex: 50,
      }}>
        {/* ── Left: HP / EN / LV+XP ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <StatBar value={stats.health} max={stats.maxHealth} color="#EF4444" label="HP" width={140} />
          <StatBar value={stats.energy} max={100}             color="#3B82F6" label="EN" width={140} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontSize: 9,
              fontFamily: '"Pixelify Sans", monospace',
              color: classColor,
              letterSpacing: '0.06em',
              width: 24,
              flexShrink: 0,
            }}>
              LV
            </div>
            <div style={{
              width: 140,
              height: 6,
              background: '#111827',
              border: '1px solid #374151',
              flexShrink: 0,
            }}>
              <div style={{
                width: `${stats.nextLevelXp > 0 ? (stats.experience / stats.nextLevelXp) * 100 : 0}%`,
                height: '100%',
                background: '#22C55E',
                transition: 'width 80ms ease',
              }} />
            </div>
            <div style={{
              fontSize: 9,
              color: '#E5E7EB',
              fontFamily: '"Pixelify Sans", monospace',
              minWidth: 32,
              textAlign: 'right',
            }}>
              {stats.level}
            </div>
          </div>
        </div>

        {/* ── Right: Floor + Enemies ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#111827',
            border: '1px solid #374151',
            padding: '5px 10px',
          }}>
            <div style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em' }}>FLOOR</div>
            <div style={{
              fontSize: 14,
              fontFamily: '"Pixelify Sans", monospace',
              color: '#E5E7EB',
              fontWeight: 700,
              minWidth: 20,
              textAlign: 'right',
            }}>
              {String(stats.floor).padStart(2, '0')}
            </div>
          </div>

          {stats.roomState === 'clearing' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#111827',
              border: '1px solid #374151',
              padding: '5px 10px',
            }}>
              <div style={{ fontSize: 9, color: '#6B7280', letterSpacing: '0.1em' }}>ENEMIES</div>
              <div style={{
                fontSize: 14,
                fontFamily: '"Pixelify Sans", monospace',
                color: stats.enemiesRemaining > 0 ? '#EF4444' : '#22C55E',
                fontWeight: 700,
                minWidth: 20,
                textAlign: 'right',
              }}>
                {stats.enemiesRemaining}
              </div>
            </div>
          )}

          {stats.roomState === 'dropped' && (
            <div style={{
              fontSize: 9,
              color: '#D4A017',
              background: '#111827',
              border: '1px solid #D4A017',
              padding: '5px 10px',
              letterSpacing: '0.1em',
            }}>
              KEY DROPPED
            </div>
          )}

          {stats.roomState === 'unlocked' && (
            <div style={{
              fontSize: 9,
              color: '#22C55E',
              background: '#111827',
              border: '1px solid #22C55E',
              padding: '5px 10px',
              letterSpacing: '0.1em',
            }}>
              EXIT OPEN ↑
            </div>
          )}
        </div>
      </div>

      {/* ── BOSS HEALTH BAR ───────────────────────────────────────── */}
      {stats.isBossFloor && stats.bossMaxHealth > 0 && (
        <div style={{
          position: 'absolute',
          top: 88,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          zIndex: 50,
          background: '#1F2937',
          border: '1px solid #374151',
          borderTop: '1px solid #EF4444',
          padding: '10px 14px 12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{
              fontSize: 10,
              fontFamily: '"Pixelify Sans", monospace',
              color: '#EF4444',
              letterSpacing: '0.12em',
            }}>
              BOSS
            </div>
            <div style={{ fontSize: 9, color: '#6B7280' }}>
              {Math.ceil(stats.bossHealth)} / {stats.bossMaxHealth}
            </div>
          </div>
          <div style={{
            height: 8,
            background: '#111827',
            border: '1px solid #374151',
          }}>
            <div style={{
              width: `${stats.bossMaxHealth > 0 ? (stats.bossHealth / stats.bossMaxHealth) * 100 : 0}%`,
              height: '100%',
              background: '#EF4444',
              transition: 'width 120ms ease',
            }} />
          </div>
        </div>
      )}

      {/* ── FIRST-LOAD PROMPT (no abilities unlocked yet) ─────────── */}
      {!hasAbilities && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#1F2937',
          border: '1px solid #374151',
          borderTop: `2px solid ${classColor}`,
          padding: '24px 32px',
          textAlign: 'center',
          pointerEvents: 'auto',
          zIndex: 40,
          minWidth: 300,
        }}>
          <div style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 13,
            color: '#E5E7EB',
            marginBottom: 8,
            letterSpacing: '0.06em',
          }}>
            ABILITIES LOCKED
          </div>
          <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
            Defeat enemies to gain XP and unlock abilities.
          </div>
          <button
            onClick={() => game.forceSync()}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 0',
              background: '#111827',
              border: `1px solid ${classColor}`,
              color: classColor,
              fontFamily: '"Pixelify Sans", monospace',
              fontSize: 11,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1a2030')}
            onMouseLeave={e => (e.currentTarget.style.background = '#111827')}
          >
            FORCE LEVEL UP (DEBUG)
          </button>
        </div>
      )}

      {/* ── CENTER NOTIFICATION ───────────────────────────────────── */}
      {stats.visibleNotif && hasAbilities && (
        <div style={{
          position: 'absolute',
          top: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1F2937',
          border: '1px solid #374151',
          padding: '8px 20px',
          zIndex: 40,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 12,
            color: '#E5E7EB',
            letterSpacing: '0.08em',
          }}>
            {stats.visibleNotif}
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR: ABILITY BAR + INFO ───────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 14px 12px',
        background: 'rgba(17,24,39,0.82)',
        borderTop: '1px solid #374151',
        zIndex: 50,
      }}>
        {/* Left: class + rebind hint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 13,
            fontWeight: 700,
            color: classColor,
            letterSpacing: '0.1em',
          }}>
            {stats.playerClass.toUpperCase()}
          </div>
          <div style={{ fontSize: 8, color: '#4B5563', letterSpacing: '0.05em' }}>
            {stats.rebindTarget !== null
              ? 'press a key to rebind...'
              : 'click ability to rebind'}
          </div>
        </div>

        {/* Center: abilities */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          {stats.abilities.map((ab, i) => (
            <AbilitySlot
              key={ab.id}
              ab={ab}
              index={i}
              isRebindTarget={stats.rebindTarget === i}
              onRebind={(idx) => { game.rebindTarget = idx; }}
              classColor={classColor}
            />
          ))}
        </div>

        {/* Right: score */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: '#4B5563', letterSpacing: '0.1em', marginBottom: 4 }}>
            SCORE
          </div>
          <div style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 20,
            fontWeight: 700,
            color: '#D4A017',
          }}>
            {stats.score}
          </div>
        </div>
      </div>
    </div>
  );
}
