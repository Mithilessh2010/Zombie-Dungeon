import React, { useState, useEffect } from 'react';
import { Game } from '../game/Game';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface AdminPanelProps {
  game: Game;
}

export function AdminPanel({ game }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [floorInput, setFloorInput] = useState('1');

  // Toggle on Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const jumpToFloor = (floor: number) => {
    if (!game.player) return;
    game.floor = Math.max(1, Math.min(game.maxFloor, floor));
    game.initializeRoom();
    game.checkUnlocks();
  };

  const quickJump = (floor: number) => {
    jumpToFloor(floor);
  };

  const handleFloorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFloorInput(e.target.value);
  };

  const handleFloorInputSubmit = () => {
    const floor = parseInt(floorInput, 10);
    if (!isNaN(floor)) {
      jumpToFloor(floor);
      setFloorInput(String(floor));
    }
  };

  if (!game.playing || !isOpen) return null;

  const buttonStyle = (bgColor: string) => ({
    padding: '8px 12px',
    background: bgColor,
    border: '1px solid #374151',
    color: '#E5E7EB',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 10,
    cursor: 'pointer',
    transition: 'all 80ms ease',
    letterSpacing: '0.06em',
  });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 200,
        left: 14,
        background: '#1F2937',
        border: '2px solid #D4A017',
        padding: 12,
        borderRadius: 4,
        zIndex: 100,
        minWidth: 320,
        fontFamily: '"IBM Plex Mono", monospace',
        color: '#E5E7EB',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: '1px solid #374151',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#D4A017',
            letterSpacing: '0.1em',
          }}
        >
          ADMIN PANEL
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Game State Info */}
      <div style={{ marginBottom: 12, fontSize: 9, color: '#9CA3AF', lineHeight: 1.6 }}>
        <div>
          <span style={{ color: '#6B7280' }}>Floor:</span> {game.floor}/{game.maxFloor}
        </div>
        <div>
          <span style={{ color: '#6B7280' }}>Health:</span> {Math.ceil(game.playerHealth)}/
          {game.playerMaxHealth}
        </div>
        <div>
          <span style={{ color: '#6B7280' }}>Level:</span> {game.level}
        </div>
        <div>
          <span style={{ color: '#6B7280' }}>Enemies:</span> {game.enemies.length}
        </div>
        <div>
          <span style={{ color: '#6B7280' }}>Room State:</span> {game.roomState}
        </div>
      </div>

      {/* Floor Input */}
      <div style={{ marginBottom: 10, display: 'flex', gap: 6 }}>
        <input
          type="number"
          min="1"
          max={game.maxFloor}
          value={floorInput}
          onChange={handleFloorInputChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleFloorInputSubmit();
          }}
          style={{
            flex: 1,
            padding: '6px 8px',
            background: '#111827',
            border: '1px solid #374151',
            color: '#E5E7EB',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 10,
          }}
          placeholder="Floor..."
        />
        <button
          onClick={handleFloorInputSubmit}
          style={{
            ...buttonStyle('#1F2937'),
            border: '1px solid #D4A017',
            color: '#D4A017',
            padding: '6px 12px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#2a3544';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#1F2937';
          }}
        >
          Go
        </button>
      </div>

      {/* Quick Jump Buttons */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 9,
            color: '#6B7280',
            marginBottom: 6,
            letterSpacing: '0.06em',
          }}
        >
          QUICK JUMPS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            onClick={() => quickJump(1)}
            style={buttonStyle('#111827')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1a2030';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#111827';
            }}
          >
            START (F1)
          </button>
          <button
            onClick={() => quickJump(11)}
            style={buttonStyle('#111827')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1a2030';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#111827';
            }}
          >
            BOSS 1 (F2)
          </button>
          <button
            onClick={() => quickJump(21)}
            style={buttonStyle('#111827')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1a2030';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#111827';
            }}
          >
            BOSS 2 (F3)
          </button>
          <button
            onClick={() => quickJump(31)}
            style={buttonStyle('#111827')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1a2030';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#111827';
            }}
          >
            FINAL (F4)
          </button>
        </div>
      </div>

      {/* Utility Buttons */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 9,
            color: '#6B7280',
            marginBottom: 6,
            letterSpacing: '0.06em',
          }}
        >
          UTILITIES
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => {
              game.playerHealth = game.playerMaxHealth;
            }}
            style={buttonStyle('#1F2937')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a3544';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1F2937';
            }}
          >
            HEAL
          </button>
          <button
            onClick={() => {
              game.enemies.forEach(e => {
                e.health = 0;
              });
            }}
            style={buttonStyle('#1F2937')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a3544';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1F2937';
            }}
          >
            KILL ALL
          </button>
          <button
            onClick={() => {
              game.abilities.forEach(a => {
                a.isUnlocked = true;
              });
            }}
            style={buttonStyle('#1F2937')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a3544';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1F2937';
            }}
          >
            UNLOCK ALL
          </button>
        </div>
      </div>

      {/* Help */}
      <div
        style={{
          fontSize: 8,
          color: '#4B5563',
          borderTop: '1px solid #374151',
          paddingTop: 8,
          lineHeight: 1.6,
        }}
      >
        Press <strong>Ctrl+Shift+D</strong> to toggle
      </div>
    </div>
  );
}
