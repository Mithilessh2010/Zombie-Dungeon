/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';
import { HUD } from './components/HUD';

// ─── Class metadata ───────────────────────────────────────────────
const CLASSES = [
  { id: 'knight', label: 'KNIGHT', tag: 'Balanced · Durable',    color: '#D4A017', desc: 'High HP, shield block, crowd control.' },
  { id: 'rogue',  label: 'ROGUE',  tag: 'Fast · Lethal',         color: '#A855F7', desc: 'Burst damage, bleeds, shadow step.'    },
  { id: 'mage',   label: 'MAGE',   tag: 'Ranged · Burst',        color: '#3B82F6', desc: 'Elemental spells, AoE, blink.'         },
  { id: 'archer', label: 'ARCHER', tag: 'Precise · Rapid',       color: '#22C55E', desc: 'Long range, volley, dodge roll.'       },
] as const;

// ─── Tiny pixel-art class icons drawn in SVG ─────────────────────
const ClassIcon = ({ id, color }: { id: string; color: string }) => {
  const icons: Record<string, React.ReactNode> = {
    knight: (
      <svg width="32" height="32" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="0" width="2" height="2" fill={color} />
        <rect x="2" y="2" width="4" height="3" fill={color} />
        <rect x="1" y="2" width="1" height="2" fill={color} opacity="0.6" />
        <rect x="6" y="2" width="1" height="2" fill={color} opacity="0.6" />
        <rect x="3" y="5" width="2" height="3" fill={color} />
        <rect x="2" y="6" width="1" height="2" fill={color} opacity="0.7" />
        <rect x="5" y="6" width="1" height="2" fill={color} opacity="0.7" />
      </svg>
    ),
    rogue: (
      <svg width="32" height="32" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="0" width="2" height="2" fill={color} />
        <rect x="2" y="2" width="4" height="3" fill={color} />
        <rect x="6" y="1" width="2" height="1" fill={color} opacity="0.8" />
        <rect x="3" y="5" width="2" height="3" fill={color} />
        <rect x="2" y="6" width="1" height="2" fill={color} opacity="0.7" />
        <rect x="5" y="6" width="1" height="2" fill={color} opacity="0.7" />
      </svg>
    ),
    mage: (
      <svg width="32" height="32" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="0" width="2" height="2" fill={color} />
        <rect x="2" y="2" width="4" height="3" fill={color} />
        <rect x="0" y="3" width="2" height="1" fill={color} opacity="0.5" />
        <rect x="6" y="3" width="2" height="1" fill={color} opacity="0.5" />
        <rect x="3" y="5" width="2" height="3" fill={color} />
        <rect x="3" y="0" width="2" height="1" fill="#fff" opacity="0.4" />
      </svg>
    ),
    archer: (
      <svg width="32" height="32" viewBox="0 0 8 8" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="0" width="2" height="2" fill={color} />
        <rect x="2" y="2" width="4" height="3" fill={color} />
        <rect x="7" y="0" width="1" height="8" fill={color} opacity="0.4" />
        <rect x="3" y="5" width="2" height="3" fill={color} />
        <rect x="2" y="6" width="1" height="2" fill={color} opacity="0.7" />
        <rect x="5" y="6" width="1" height="2" fill={color} opacity="0.7" />
      </svg>
    ),
  };
  return <>{icons[id]}</>;
};

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [game, setGame]           = useState<Game | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [hovered, setHovered]     = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current && containerRef.current && !game) {
      const newGame = new Game(canvasRef.current, containerRef.current);
      setGame(newGame);

      const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
          canvasRef.current.width  = containerRef.current.clientWidth;
          canvasRef.current.height = containerRef.current.clientHeight;
          newGame.handleResize();
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize();
      return () => {
        window.removeEventListener('resize', handleResize);
        newGame.destroy();
      };
    }
  }, []);

  const startGame = (cls: string) => {
    if (game) {
      game.start(cls);
      setGameState('playing');
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ fontFamily: '"IBM Plex Mono", monospace', background: '#111827' }}
      className="relative w-screen h-screen overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block touch-none" />

      {/* ── MENU ── */}
      {gameState === 'menu' && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ background: 'rgba(10,12,18,0.92)' }}
        >
          <div
            style={{
              width: 480,
              background: '#1F2937',
              border: '1px solid #E5E7EB',
              padding: '40px 36px',
            }}
          >
            {/* Title */}
            <div style={{ marginBottom: 32, borderBottom: '1px solid #374151', paddingBottom: 24 }}>
              <div style={{
                fontFamily: '"Pixelify Sans", monospace',
                fontSize: 11,
                letterSpacing: '0.2em',
                color: '#6B7280',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
                Ancient Ascendance
              </div>
              <div style={{
                fontFamily: '"Pixelify Sans", monospace',
                fontSize: 38,
                fontWeight: 700,
                color: '#E5E7EB',
                lineHeight: 1.1,
              }}>
                STICKMAN<br />
                <span style={{ color: '#D4A017' }}>RPG</span>
              </div>
            </div>

            {/* Instruction */}
            <div style={{
              fontSize: 11,
              color: '#6B7280',
              marginBottom: 16,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Select Class
            </div>

            {/* Class grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CLASSES.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => startGame(cls.id)}
                  onMouseEnter={() => setHovered(cls.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    background: hovered === cls.id ? '#263241' : '#111827',
                    border: `1px solid ${hovered === cls.id ? cls.color : '#374151'}`,
                    borderLeft: `3px solid ${cls.color}`,
                    cursor: 'pointer',
                    transition: 'all 80ms ease',
                    textAlign: 'left',
                    gap: 8,
                  }}
                >
                  <ClassIcon id={cls.id} color={cls.color} />
                  <div>
                    <div style={{
                      fontFamily: '"Pixelify Sans", monospace',
                      fontSize: 15,
                      fontWeight: 700,
                      color: hovered === cls.id ? cls.color : '#E5E7EB',
                      letterSpacing: '0.04em',
                    }}>
                      {cls.label}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: '#6B7280',
                      marginTop: 2,
                      letterSpacing: '0.05em',
                    }}>
                      {cls.tag}
                    </div>
                  </div>
                  {hovered === cls.id && (
                    <div style={{
                      fontSize: 10,
                      color: '#9CA3AF',
                      marginTop: 2,
                      lineHeight: 1.5,
                    }}>
                      {cls.desc}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div style={{
              marginTop: 24,
              borderTop: '1px solid #374151',
              paddingTop: 16,
              fontSize: 10,
              color: '#4B5563',
              letterSpacing: '0.06em',
            }}>
              WASD / ARROWS to move · Click + keys to attack · Reach Floor 31
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYING ── */}
      {gameState === 'playing' && game && (
        <HUD game={game} onGameOver={() => setGameState('gameover')} />
      )}

      {/* ── GAME OVER ── */}
      {gameState === 'gameover' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          style={{ background: 'rgba(10,12,18,0.97)' }}
        >
          <div
            style={{
              background: '#1F2937',
              border: '1px solid #374151',
              borderTop: '2px solid #EF4444',
              padding: '40px 56px',
              textAlign: 'center',
              minWidth: 320,
            }}
          >
            <div style={{
              fontFamily: '"Pixelify Sans", monospace',
              fontSize: 10,
              letterSpacing: '0.25em',
              color: '#EF4444',
              marginBottom: 10,
              textTransform: 'uppercase',
            }}>
              You Died
            </div>
            <div style={{
              fontFamily: '"Pixelify Sans", monospace',
              fontSize: 48,
              fontWeight: 700,
              color: '#E5E7EB',
              lineHeight: 1,
              marginBottom: 8,
            }}>
              GAME<br />OVER
            </div>
            <div style={{
              marginTop: 24,
              marginBottom: 32,
              padding: '14px 0',
              borderTop: '1px solid #374151',
              borderBottom: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                <span style={{ color: '#6B7280', marginRight: 12 }}>FLOOR</span>
                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{game?.floor ?? '—'}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                <span style={{ color: '#6B7280', marginRight: 12 }}>SCORE</span>
                <span style={{ color: '#D4A017', fontWeight: 600 }}>{game?.score ?? 0}</span>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 0',
                background: '#111827',
                border: '1px solid #E5E7EB',
                color: '#E5E7EB',
                fontFamily: '"Pixelify Sans", monospace',
                fontSize: 13,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'background 80ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1F2937')}
              onMouseLeave={e => (e.currentTarget.style.background = '#111827')}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
