import React, { useEffect, useState } from 'react';
import { Game } from '../game/Game';
import {
  Shield, Sword, RotateCw, Zap, Crown, FlaskConical, Ghost,
  Cloud, Flame, Snowflake, Waves, MoveUpRight, Star, Target,
  ChevronLast, RefreshCw, Bomb, CloudRain,
} from 'lucide-react';

interface VictoryScreenProps {
  game: Game;
}

const IconMap: Record<string, React.ReactNode> = {
  Shield: <Shield size={14} />,
  Sword: <Sword size={14} />,
  RotateCw: <RotateCw size={14} />,
  Zap: <Zap size={14} />,
  Crown: <Crown size={14} />,
  FlaskConical: <FlaskConical size={14} />,
  Ghost: <Ghost size={14} />,
  Cloud: <Cloud size={14} />,
  Flame: <Flame size={14} />,
  Snowflake: <Snowflake size={14} />,
  Waves: <Waves size={14} />,
  MoveUpRight: <MoveUpRight size={14} />,
  Star: <Star size={14} />,
  Target: <Target size={14} />,
  ChevronLast: <ChevronLast size={14} />,
  RefreshCw: <RefreshCw size={14} />,
  Bomb: <Bomb size={14} />,
  CloudRain: <CloudRain size={14} />,
};

export function VictoryScreen({ game }: VictoryScreenProps) {
  const [danceFrame, setDanceFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDanceFrame(prev => (prev + 1) % 6);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Draw a dancing stickman in an SVG canvas
  const drawDancingStickman = (frame: number) => {
    const frames = [
      // Frame 0: Neutral
      { armL: -0.3, armR: 0.3, legL: -0.2, legR: 0.2 },
      // Frame 1: Right swing
      { armL: 0.5, armR: -0.5, legL: -0.4, legR: 0.1 },
      // Frame 2: Up
      { armL: -0.8, armR: -0.8, legL: -0.1, legR: -0.1 },
      // Frame 3: Left swing
      { armL: -0.5, armR: 0.5, legL: 0.1, legR: -0.4 },
      // Frame 4: Neutral
      { armL: -0.3, armR: 0.3, legL: -0.2, legR: 0.2 },
      // Frame 5: Jump
      { armL: -0.8, armR: -0.8, legL: -0.5, legR: -0.5, jump: 30 },
    ];

    const f = frames[frame];
    const cx = 120;
    const cy = 120;
    const jump = f.jump || 0;

    return (
      <svg width="240" height="240" viewBox="0 0 240 240" style={{ imageRendering: 'pixelated' }}>
        {/* Head */}
        <circle cx={cx} cy={cy - 60 - jump} r="18" fill="#D4A017" />
        {/* Eyes */}
        <circle cx={cx - 6} cy={cy - 62 - jump} r="2" fill="#111827" />
        <circle cx={cx + 6} cy={cy - 62 - jump} r="2" fill="#111827" />

        {/* Body */}
        <line x1={cx} y1={cy - 40 - jump} x2={cx} y2={cy} stroke="#D4A017" strokeWidth="4" />

        {/* Left Arm */}
        <line
          x1={cx}
          y1={cy - 30 - jump}
          x2={cx + Math.sin(f.armL) * 60}
          y2={cy - 30 - jump + Math.cos(f.armL) * 60}
          stroke="#D4A017"
          strokeWidth="3"
        />

        {/* Right Arm */}
        <line
          x1={cx}
          y1={cy - 30 - jump}
          x2={cx + Math.sin(f.armR) * 60}
          y2={cy - 30 - jump + Math.cos(f.armR) * 60}
          stroke="#D4A017"
          strokeWidth="3"
        />

        {/* Left Leg */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + Math.sin(f.legL) * 50}
          y2={cy + Math.cos(f.legL) * 50}
          stroke="#D4A017"
          strokeWidth="3"
        />

        {/* Right Leg */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + Math.sin(f.legR) * 50}
          y2={cy + Math.cos(f.legR) * 50}
          stroke="#D4A017"
          strokeWidth="3"
        />
      </svg>
    );
  };

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center"
      style={{ background: 'rgba(10,12,18,0.98)' }}
    >
      <div
        style={{
          background: '#1F2937',
          border: '2px solid #D4A017',
          padding: '48px 56px',
          textAlign: 'center',
          minWidth: 700,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}
      >
        {/* Dancing Stickman */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          {drawDancingStickman(danceFrame)}
        </div>

        {/* Victory Title */}
        <div
          style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 10,
            letterSpacing: '0.25em',
            color: '#D4A017',
            marginBottom: 16,
            textTransform: 'uppercase',
          }}
        >
          TOWER CONQUERED
        </div>

        <div
          style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 56,
            fontWeight: 700,
            color: '#E5E7EB',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          VICTORY!
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: 24,
            marginBottom: 24,
            padding: '16px 0',
            borderTop: '1px solid #374151',
            borderBottom: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            <span style={{ color: '#6B7280', marginRight: 16 }}>FLOORS CLEARED</span>
            <span style={{ color: '#22C55E', fontWeight: 600 }}>{game.floor}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            <span style={{ color: '#6B7280', marginRight: 16 }}>FINAL LEVEL</span>
            <span style={{ color: '#3B82F6', fontWeight: 600 }}>{game.level}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            <span style={{ color: '#6B7280', marginRight: 16 }}>TOTAL SCORE</span>
            <span style={{ color: '#D4A017', fontWeight: 600 }}>{game.score}</span>
          </div>
        </div>

        {/* Abilities Section (only 1-5) */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 9,
              color: '#6B7280',
              marginBottom: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textAlign: 'left',
              paddingBottom: 8,
              borderBottom: '1px solid #374151',
            }}
          >
            UNLOCKED ABILITIES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8 }}>
            {game.abilities
              .filter((ab) => ab.isUnlocked && ['1', '2', '3', '4', '5'].includes(ab.keybind))
              .sort((a, b) => {
                const order = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
                return (order[a.keybind as keyof typeof order] ?? 99) - (order[b.keybind as keyof typeof order] ?? 99);
              })
              .map((ab) => (
                <div
                  key={ab.id}
                  style={{
                    background: '#111827',
                    border: '1px solid #374151',
                    padding: '10px 8px',
                    fontSize: 8,
                    color: '#E5E7EB',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#D4A017', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                    {IconMap[ab.icon] ?? <Zap size={12} />}
                  </div>
                  <div style={{ fontFamily: '"Pixelify Sans", monospace', fontSize: 9, fontWeight: 600, marginBottom: 4 }}>
                    {ab.name}
                  </div>
                  <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 4 }}>{ab.description}</div>
                  <div
                    style={{
                      background: '#1F2937',
                      border: '1px solid #374151',
                      padding: '2px 4px',
                      fontSize: 7,
                      color: '#9CA3AF',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                    }}
                  >
                    [{ab.keybind}]
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 11,
            color: '#6B7280',
            marginBottom: 24,
            lineHeight: 1.8,
            letterSpacing: '0.04em',
          }}
        >
          Thank you for playing <br />
          <span style={{ color: '#E5E7EB', fontWeight: 600 }}>STICKMAN RPG</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              flex: 1,
              padding: '14px 0',
              background: '#111827',
              border: '1px solid #D4A017',
              color: '#D4A017',
              fontFamily: '"Pixelify Sans", monospace',
              fontSize: 13,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 80ms ease',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1a2030';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#111827';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A017';
            }}
          >
            RETURN TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
