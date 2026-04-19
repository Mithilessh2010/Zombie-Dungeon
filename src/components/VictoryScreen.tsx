import React from 'react';
import { Game } from '../game/Game';

interface VictoryScreenProps {
  game: Game;
}

export function VictoryScreen({ game }: VictoryScreenProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center"
      style={{ background: 'rgba(10,12,18,0.98)' }}
    >
      <div
        style={{
          background: '#1F2937',
          border: '2px solid #D4A017',
          padding: '60px 80px',
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 14,
            letterSpacing: '0.25em',
            color: '#D4A017',
            marginBottom: 20,
            textTransform: 'uppercase',
          }}
        >
          YOU WON!
        </div>

        <div
          style={{
            fontFamily: '"Pixelify Sans", monospace',
            fontSize: 48,
            fontWeight: 700,
            color: '#22C55E',
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          TOWER<br />CONQUERED
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#9CA3AF',
            marginBottom: 24,
            lineHeight: 1.8,
            letterSpacing: '0.05em',
          }}
        >
          Thanks for playing!
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#6B7280',
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid #374151',
          }}
        >
          Nice job reaching the top. You're awesome!
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'block',
            width: '100%',
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
  );
}
