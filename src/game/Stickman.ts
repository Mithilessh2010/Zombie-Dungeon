import { Vector2, AnimationState, StatusEffect } from './types.ts';

/**
 * Stickman animation and rendering class
 * Handles limb rotations and state machine for animations
 */
export class Stickman {
  // Skeleton state
  position: Vector2 = { x: 0, y: 0 };
  scale: number = 1;
  flipX: boolean = false;
  color: string = '#ffffff';
  charClass: string = 'knight';
  
  // Visual effects
  hitFlash: number = 0;
  effects: StatusEffect[] = [];
  
  // Bone rotations (radians)
  boneRotations: Record<string, number> = {
    spine: 0,
    head: 0,
    lArmU: 0, lArmL: 0,
    rArmU: 0, rArmL: 0,
    lLegU: 0, lLegL: 0,
    rLegU: 0, rLegL: 0,
  };

  // Animation state
  state: AnimationState = 'idle';
  stateTime: number = 0;
  animationFrame: number = 0;

  constructor(position: Vector2, color = '#ffffff', charClass = 'knight') {
    this.position = { ...position };
    this.color = color;
    this.charClass = charClass;
  }

  update(dt: number) {
    this.stateTime += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt * 10;
    
    // Update status effects
    this.effects = this.effects.filter(e => {
        e.duration -= dt;
        return e.duration > 0;
    });

    this.updateSkeletonAnimations();
  }

  private updateSkeletonAnimations() {
    const t = this.stateTime;
    
    // Reset rotations to neutral slightly modified per state
    switch (this.state) {
      case 'idle':
        this.animateIdle(t);
        break;
      case 'run':
        this.animateRun(t);
        break;
      case 'attack':
        this.animateAttack(t);
        break;
      case 'skill':
        this.animateSkill(t);
        break;
      case 'hurt':
        this.animateHurt(t);
        break;
      case 'death':
        this.animateDeath(t);
        break;
    }
  }

  private animateIdle(t: number) {
    const breath = Math.sin(t * 3) * 0.05;
    this.boneRotations.spine = breath;
    this.boneRotations.head = -breath * 0.5;
    
    // Class specific idle
    if (this.charClass === 'mage') {
        this.boneRotations.rArmU = -1 + breath;
        this.boneRotations.rArmL = -0.5;
        this.boneRotations.lArmU = 0.5 + breath;
    } else if (this.charClass === 'archer') {
        this.boneRotations.lArmU = 0.8;
        this.boneRotations.rArmU = -0.8;
    } else {
        this.boneRotations.lArmU = 0.2 + breath;
        this.boneRotations.rArmU = -0.2 - breath;
    }
    
    this.boneRotations.lArmL = -0.1;
    this.boneRotations.rArmL = 0.1;
    this.boneRotations.lLegU = 0.1;
    this.boneRotations.rLegU = -0.1;
  }

  private animateRun(t: number) {
    const runCycle = t * 14;
    const swing = Math.sin(runCycle);
    
    this.boneRotations.spine = swing * 0.15;
    this.boneRotations.head = -this.boneRotations.spine;
    
    // Legs
    this.boneRotations.lLegU = swing * 1;
    this.boneRotations.lLegL = Math.max(0, -swing) * 1.2;
    this.boneRotations.rLegU = -swing * 1;
    this.boneRotations.rLegL = Math.max(0, swing) * 1.2;
    
    // Arms (oppo legs)
    if (this.charClass === 'mage') {
        this.boneRotations.rArmU = -1 + swing * 0.2;
        this.boneRotations.lArmU = 0.5 - swing * 0.2;
    } else {
        this.boneRotations.lArmU = -swing * 0.8 + 0.5;
        this.boneRotations.rArmU = swing * 0.8 - 0.5;
    }
    this.boneRotations.lArmL = -0.5;
    this.boneRotations.rArmL = 0.5;
  }

  private animateAttack(t: number) {
    const dur = 0.25;
    const p = Math.min(t / dur, 1);
    
    if (this.charClass === 'mage' || this.charClass === 'archer') {
        // Ranged windup
        if (p < 0.4) {
            const wp = p / 0.4;
            this.boneRotations.rArmU = -1.5 * wp;
            this.boneRotations.lArmU = 1.5 * wp;
        } else {
            this.boneRotations.rArmU = -1.5;
            this.boneRotations.lArmU = 1.5;
        }
    } else {
        // Melee swing
        if (p < 0.2) { // Anticipation
          const wp = p / 0.2;
          this.boneRotations.rArmU = -2 * wp;
          this.boneRotations.spine = -0.3 * wp;
        } else if (p < 0.5) { // Impact
          const sp = (p - 0.2) / 0.3;
          this.boneRotations.rArmU = -2 + 4.5 * sp;
          this.boneRotations.spine = -0.3 + 0.6 * sp;
          this.boneRotations.rArmL = -0.5 * sp;
        } else { // Recovery
          const rp = (p - 0.5) / 0.5;
          this.boneRotations.rArmU = 2.5 - 2.5 * rp;
          this.boneRotations.spine = 0.3 - 0.3 * rp;
        }
    }
  }

  private animateHurt(t: number) {
    const shake = Math.sin(t * 50) * 0.2;
    this.boneRotations.spine = 0.3;
    this.boneRotations.head = -0.2 + shake;
    this.boneRotations.lArmU = 1;
    this.boneRotations.rArmU = -1;
  }

  private animateDeath(t: number) {
      const p = Math.min(t, 1);
      this.boneRotations.spine = 1.5 * p;
      this.boneRotations.lLegU = -0.5 * p;
      this.boneRotations.rLegU = 0.5 * p;
  }
  
  private animateSkill(t: number) {
      // Overridden by subclasses usually, but here's a placeholder
      this.animateAttack(t);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    if (this.flipX) ctx.scale(-1, 1);
    ctx.scale(this.scale, this.scale);
    
    // Impact Flash
    if (this.hitFlash > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
    } else {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const scaleFactor = 40; // Base size
    
    const hips = { x: 0, y: 0 };
    
    // Spine
    const spineLen = 0.6 * scaleFactor;
    const spineEnd = this.getPoint(hips, -Math.PI/2 + this.boneRotations.spine, spineLen);
    
    // Draw status effects visual
    const headRadius = 0.25 * scaleFactor;
    this.drawStatusOverlays(ctx, spineEnd, headRadius, scaleFactor);
    
    this.drawLine(ctx, hips, spineEnd);
    
    // Head
    const headCenter = this.getPoint(spineEnd, -Math.PI/2 + this.boneRotations.head, headRadius);
    ctx.beginPath();
    ctx.arc(headCenter.x, headCenter.y, headRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Weapons & Arms
    this.drawLimbWithWeapon(ctx, spineEnd, 'arm', true, scaleFactor);
    this.drawLimbWithWeapon(ctx, spineEnd, 'arm', false, scaleFactor);
    
    // Legs
    this.drawLimbWithWeapon(ctx, hips, 'leg', true, scaleFactor);
    this.drawLimbWithWeapon(ctx, hips, 'leg', false, scaleFactor);
    
    ctx.restore();
  }

  private drawLimbWithWeapon(ctx: CanvasRenderingContext2D, start: Vector2, type: 'arm' | 'leg', isLeft: boolean, sf: number) {
      const uKey = isLeft ? (type === 'arm' ? 'lArmU' : 'lLegU') : (type === 'arm' ? 'rArmU' : 'rLegU');
      const lKey = isLeft ? (type === 'arm' ? 'lArmL' : 'lLegL') : (type === 'arm' ? 'rArmL' : 'rLegL');
      
      const uLen = (type === 'arm' ? 0.4 : 0.5) * sf;
      const lLen = (type === 'arm' ? 0.4 : 0.5) * sf;
      
      const mid = this.getPoint(start, Math.PI/2 + this.boneRotations[uKey], uLen);
      const end = this.getPoint(mid, Math.PI/2 + this.boneRotations[uKey] + this.boneRotations[lKey], lLen);
      
      this.drawLine(ctx, start, mid);
      this.drawLine(ctx, mid, end);
      
      // Draw Weapon on hand
      if (type === 'arm') {
          this.drawWeapon(ctx, end, this.boneRotations[uKey] + this.boneRotations[lKey], isLeft);
      }
  }

  private drawWeapon(ctx: CanvasRenderingContext2D, hand: Vector2, angle: number, isLeft: boolean) {
      ctx.save();
      ctx.translate(hand.x, hand.y);
      ctx.rotate(Math.PI/2 + angle);
      
      ctx.lineWidth = 3;
      
      if (this.charClass === 'knight') {
          if (!isLeft) { // Sword in right hand
              ctx.strokeStyle = '#D4A017'; // Sword blade
                            ctx.shadowBlur = 0;
              ctx.beginPath();
              ctx.moveTo(0, 0); ctx.lineTo(0, -35);
              ctx.stroke();
              ctx.shadowBlur = 0;
              ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff';
              ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); // Crossguard
              ctx.stroke();
          } else { // Shield in left
              ctx.fillStyle = '#111';
              ctx.strokeStyle = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(-10, -5); ctx.lineTo(10, -5); ctx.lineTo(8, 15); ctx.lineTo(0, 22); ctx.lineTo(-8, 15);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
          }
      } else if (this.charClass === 'rogue') {
          ctx.strokeStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(0, -20);
          ctx.stroke();
      } else if (this.charClass === 'mage') {
          if (!isLeft) {
              ctx.strokeStyle = '#78350f';
              ctx.lineWidth = 4;
              ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -40); ctx.stroke();
              ctx.fillStyle = '#3b82f6';
              ctx.beginPath(); ctx.arc(0, -45, 6, 0, Math.PI * 2); ctx.fill();
          }
      } else if (this.charClass === 'archer') {
          if (isLeft) {
              ctx.strokeStyle = '#78350f';
              ctx.beginPath();
              ctx.arc(10, 0, 25, -Math.PI/2, Math.PI/2);
              ctx.stroke();
              // String
              ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff';
              ctx.beginPath(); ctx.moveTo(10, -25); ctx.lineTo(10, 25); ctx.stroke();
          }
      }
      
      ctx.restore();
  }

  private getPoint(start: Vector2, angle: number, length: number): Vector2 {
    return {
      x: start.x + Math.cos(angle) * length,
      y: start.y + Math.sin(angle) * length
    };
  }

  private drawLine(ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  private drawStatusOverlays(ctx: CanvasRenderingContext2D, center: Vector2, headRadius: number, sf: number) {
      if (this.effects.length === 0) return;

      this.effects.forEach((eff, i) => {
          ctx.beginPath();
          if (eff.type === 'burning') {
              ctx.fillStyle = `rgba(255, 100, 0, ${0.4 + Math.sin(this.stateTime * 10) * 0.2})`;
              ctx.arc(0, -20, 30 + Math.sin(this.stateTime * 15) * 5, 0, Math.PI * 2);
          } else if (eff.type === 'chilled') {
              ctx.fillStyle = `rgba(0, 200, 255, 0.3)`;
              ctx.rect(-20, -40, 40, 60);
          } else if (eff.type === 'poisoned') {
              ctx.fillStyle = `rgba(0, 255, 100, ${0.4 + Math.sin(this.stateTime * 5) * 0.1})`;
              for (let j = 0; j < 3; j++) {
                  ctx.arc(-15 + j * 15, -45 + Math.sin(this.stateTime * 8 + j) * 5, 4, 0, Math.PI * 2);
              }
          } else if (eff.type === 'stunned') {
              ctx.strokeStyle = '#fde047';
              ctx.lineWidth = 2;
              const angle = this.stateTime * 5;
              ctx.ellipse(0, -50, 20, 8, angle, 0, Math.PI * 2);
          }
          ctx.fill();
          if (eff.type === 'stunned') ctx.stroke();
      });
  }
}
