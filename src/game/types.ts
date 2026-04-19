export type PlayerClass = 'knight' | 'rogue' | 'mage' | 'archer';

export interface Vector2 {
  x: number;
  y: number;
}

export type StatusEffectType = 'burning' | 'chilled' | 'poisoned' | 'stunned';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  damagePerSec?: number;
}

export type AnimationState = 'idle' | 'run' | 'attack' | 'skill' | 'hurt' | 'death';

export type RoomState = 'clearing' | 'dropped' | 'unlocked';

export type GameOverState = 'death' | 'victory';

export interface KeyEntity {
  x: number;
  y: number;
  active: boolean;
}

export interface Bone {
  rotation: number; // in radians
  length: number;
  child?: Bone | Bone[];
}

export interface StickmanSkeleton {
  head: Vector2;
  body: Bone;
  lArm: Bone;
  rArm: Bone;
  lLeg: Bone;
  rLeg: Bone;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'arrow' | 'magic';
  owner: 'player' | 'enemy';
  damage: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or emoji for now
  cooldown: number; // in seconds
  currentCooldown: number;
  unlockLevel: number;
  unlockFloor: number;
  isUnlocked: boolean;
  type: 'active' | 'passive' | 'ultimate';
  keybind: string;
}
