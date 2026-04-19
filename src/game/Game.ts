import { Vector2, PlayerClass, Projectile, Particle, KeyEntity, RoomState, Ability } from './types.ts';
import { Stickman } from './Stickman.ts';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  container: HTMLElement;
  
  // Game state
  playing = false;
  score = 0;
  floor = 1;
  maxFloor = 31;
  cameraOffset: Vector2 = { x: 0, y: 0 };
  shakeDecay = 0.9;
  shakePower = 0;

  towerCompleted = false;
  
  hitPauseTimer = 0;

  // Progression
  roomState: RoomState = 'clearing';
  enemiesToSpawn = 0;
  enemiesDefeated = 0;
  totalEnemiesInRoom = 0;
  key: KeyEntity | null = null;
  experience = 0;
  level = 1;
  nextLevelXp = 100;
  abilities: Ability[] = [];
  
  // Transitions
  notification: string = '';
  notificationTimer: number = 0;

  // Room bounds
  roomWidth = 1600;
  roomHeight = 1200;
  
  // Entities
  player: Stickman | null = null;
  playerClass: PlayerClass = 'knight';
  playerHealth = 100;
  playerMaxHealth = 100;
  skillCooldown = 0;
  maxSkillCooldown = 5;

  enemies: (Stickman & { health: number, maxHealth: number, type: string })[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  
  // Input
  keys: Record<string, boolean> = {};
  mouse: Vector2 = { x: 0, y: 0 };
  mouseDown = false;
  rebindTarget: number | null = null;

  lastTime = 0;
  animationFrameId = 0;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.container = container;

    this.bindInputs();
    this.loop = this.loop.bind(this);
  }

  private bindInputs() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    window.addEventListener('mousedown', () => this.mouseDown = true);
    window.addEventListener('mouseup', () => this.mouseDown = false);
    
    // Ability Keys
    window.addEventListener('keydown', (e) => {
        if (!this.player || this.player.state === 'death' || this.rebindTarget !== null) return;
        
        this.abilities.forEach((ab, i) => {
            if (ab.isUnlocked && ab.keybind === e.key.toUpperCase()) {
                this.useAbility(i);
            }
        });
    });

    window.addEventListener('mousedown', (e) => {
        this.mouseDown = true;
        if (!this.player || this.player.state === 'death') return;
        
        if (this.rebindTarget !== null) {
            if (e.button === 0) this.rebindAbility(this.rebindTarget, 'LMB');
            else if (e.button === 2) this.rebindAbility(this.rebindTarget, 'RMB');
            this.rebindTarget = null;
            return;
        }

        // Trigger ability bound to LMB/RMB
        const btn = e.button === 0 ? 'LMB' : e.button === 2 ? 'RMB' : null;
        if (btn) {
            this.abilities.forEach((ab, i) => {
                if (ab.isUnlocked && ab.keybind === btn) {
                    this.useAbility(i);
                }
            });
        }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Rebind listener
    window.addEventListener('keydown', (e) => {
        if (this.rebindTarget !== null) {
            const key = e.key.toUpperCase();
            // Prevent some keys
            if (['ESCAPE', 'ENTER'].includes(key)) {
                this.rebindTarget = null;
                return;
            }
            this.rebindAbility(this.rebindTarget, key);
            this.rebindTarget = null;
            e.preventDefault();
        }
    });

    // Touch support (basic)
    this.canvas.addEventListener('touchstart', (e) => {
        this.mouseDown = true;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => this.mouseDown = false);
  }

  start(cls: string) {
    this.playerClass = cls as PlayerClass;
    const classColors: Record<string, string> = {
      knight: '#D4A017',
      rogue:  '#A855F7',
      mage:   '#3B82F6',
      archer: '#22C55E',
    };
    const playerColor = classColors[cls] ?? '#E5E7EB';
    this.player = new Stickman({ x: this.canvas.width / 2, y: this.canvas.height / 2 }, playerColor, this.playerClass);
    this.playerHealth = this.playerMaxHealth = this.playerClass === 'knight' ? 150 : 100;
    this.score = 0;
    this.floor = 1;
    this.level = 1;
    this.experience = 0;
    this.nextLevelXp = 100;
    this.abilities = this.getInitialAbilities(this.playerClass);
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.key = null;
    this.roomState = 'clearing';
    
    this.initializeRoom();
    this.checkUnlocks(); // Initial unlock for basic
    
    this.playing = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  initializeRoom() {
      this.roomState = 'clearing';
      this.key = null;
      this.enemies = [];
      this.enemiesDefeated = 0;
      this.totalEnemiesInRoom = this.getEnemyCountForFloor();
      const currentEnemies = this.totalEnemiesInRoom; // Cache it
      this.enemiesToSpawn = currentEnemies;
      this.showNotification(`Floor ${this.floor}: ` + this.getFloorName());

      // Reset player position to start of room
      if (this.player) {
          this.player.position = { x: this.canvas.width / 2, y: this.roomHeight - 200 };
      }
  }

  checkUnlocks() {
      this.abilities.forEach(a => {
          if (!a.isUnlocked && this.level >= a.unlockLevel) {
              a.isUnlocked = true;
              this.showNotification(`AWAKENED: ${a.name}`);
          }
      });
  }

  private getInitialAbilities(cls: PlayerClass): Ability[] {
      const list: Ability[] = [];
      if (cls === 'knight') {
          list.push({ id: 'k1', name: 'Shield Block', description: 'Reduction', icon: 'Shield', cooldown: 8, currentCooldown: 0, unlockLevel: 2, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: 'LMB' });
          list.push({ id: 'k2', name: 'Heavy Strike', description: 'Stun Blow', icon: 'Sword', cooldown: 5, currentCooldown: 0, unlockLevel: 5, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '1' });
          list.push({ id: 'k3', name: 'Whirlwind', description: 'Burn Spin', icon: 'RotateCw', cooldown: 12, currentCooldown: 0, unlockLevel: 8, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '2' });
          list.push({ id: 'k4', name: 'Charge', description: 'Speed Dash', icon: 'Zap', cooldown: 7, currentCooldown: 0, unlockLevel: 11, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '3' });
          list.push({ id: 'k5', name: 'Guard Break', description: 'Full Stun', icon: 'Crown', cooldown: 15, currentCooldown: 0, unlockLevel: 14, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '4' });
      } else if (cls === 'rogue') {
          list.push({ id: 'r1', name: 'Dash Strike', description: 'Bleed Dash', icon: 'Zap', cooldown: 4, currentCooldown: 0, unlockLevel: 2, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: 'LMB' });
          list.push({ id: 'r2', name: 'Poison Blade', description: 'Poison DOT', icon: 'FlaskConical', cooldown: 10, currentCooldown: 0, unlockLevel: 5, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '1' });
          list.push({ id: 'r3', name: 'Shadow Step', description: 'Backstab', icon: 'Ghost', cooldown: 8, currentCooldown: 0, unlockLevel: 8, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '2' });
          list.push({ id: 'r4', name: 'Smoke Bomb', description: 'Area Stun', icon: 'Cloud', cooldown: 18, currentCooldown: 0, unlockLevel: 11, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '3' });
          list.push({ id: 'r5', name: 'Backstab', description: 'Crit Force', icon: 'Sword', cooldown: 12, currentCooldown: 0, unlockLevel: 14, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '4' });
      } else if (cls === 'mage') {
          list.push({ id: 'm1', name: 'Fire Burst', description: 'Burn Blast', icon: 'Flame', cooldown: 6, currentCooldown: 0, unlockLevel: 2, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: 'LMB' });
          list.push({ id: 'm2', name: 'Ice Shard', description: 'Chill Bolt', icon: 'Snowflake', cooldown: 5, currentCooldown: 0, unlockLevel: 5, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '1' });
          list.push({ id: 'm3', name: 'Arcane Wave', description: 'Push Back', icon: 'Waves', cooldown: 9, currentCooldown: 0, unlockLevel: 8, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '2' });
          list.push({ id: 'm4', name: 'Blink', description: 'Phase Shift', icon: 'MoveUpRight', cooldown: 6, currentCooldown: 0, unlockLevel: 11, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '3' });
          list.push({ id: 'm5', name: 'Lightning', description: 'AOE Zap', icon: 'Star', cooldown: 10, currentCooldown: 0, unlockLevel: 14, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '4' });
      } else if (cls === 'archer') {
          list.push({ id: 'a1', name: 'Power Shot', description: 'Pushbolt', icon: 'Target', cooldown: 5, currentCooldown: 0, unlockLevel: 2, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: 'LMB' });
          list.push({ id: 'a2', name: 'Multi Shot', description: 'Volley', icon: 'ChevronLast', cooldown: 7, currentCooldown: 0, unlockLevel: 5, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '1' });
          list.push({ id: 'a3', name: 'Roll', description: 'Dodge Roll', icon: 'RefreshCw', cooldown: 3, currentCooldown: 0, unlockLevel: 8, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '2' });
          list.push({ id: 'a4', name: 'Explode Arrow', description: 'Burn Area', icon: 'Bomb', cooldown: 12, currentCooldown: 0, unlockLevel: 11, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '3' });
          list.push({ id: 'a5', name: 'Piercing', description: 'Pierce All', icon: 'CloudRain', cooldown: 10, currentCooldown: 0, unlockLevel: 14, unlockFloor: 0, isUnlocked: false, type: 'active', keybind: '4' });
      }
      return list;
  }

  rebindAbility(index: number, newKey: string) {
      if (this.abilities[index]) {
          this.abilities[index].keybind = newKey;
          this.showNotification(`${this.abilities[index].name} -> ${newKey}`);
      }
  }

  public forceSync() {
      this.addXp(this.nextLevelXp);
  }

  private useAbility(index: number) {
      if (!this.abilities[index] || !this.abilities[index].isUnlocked || this.abilities[index].currentCooldown > 0) return;
      const ab = this.abilities[index];
      this.executeAbility(ab);
      ab.currentCooldown = ab.cooldown;
  }

  private useUltimate() {
      const ult = this.abilities.find(a => a.type === 'ultimate');
      if (ult && ult.isUnlocked && ult.currentCooldown <= 0) {
          this.executeAbility(ult);
          ult.currentCooldown = ult.cooldown;
      }
  }

  private executeAbility(ab: Ability) {
      if (!this.player) return;
      this.player.state = 'skill';
      this.player.stateTime = 0;
      this.addShake(10);
      
      const dir = this.player.flipX ? -1 : 1;

      switch (ab.id) {
          case 'k1': // Shield Block - Handled in damagePlayer implicitly or with flag
              this.showNotification("SHIELD UP");
              break;
          case 'k2': // Heavy Strike
              this.enemies.forEach(e => {
                  const dx = e.position.x - this.player!.position.x;
                  if (Math.abs(dx) < 150 && Math.sign(dx) === dir) {
                      this.damageEnemy(e, 60);
                      e.position.x += dir * 150;
                      this.applyStatus(e, 'stunned', 1.5);
                  }
              });
              break;
          case 'k3': // Whirlwind
              this.enemies.forEach(e => {
                  const dx = e.position.x - this.player!.position.x;
                  const dy = e.position.y - this.player!.position.y;
                  if (Math.sqrt(dx*dx + dy*dy) < 200) {
                      this.damageEnemy(e, 40);
                      this.applyStatus(e, 'burning', 3, 15);
                  }
              });
              break;
          case 'k4': // Charge
              this.player.position.x += dir * 250;
              this.enemies.forEach(e => {
                  if (Math.abs(e.position.x - this.player!.position.x) < 100) {
                      this.damageEnemy(e, 45);
                      this.applyStatus(e, 'stunned', 1);
                  }
              });
              break;
          case 'r1': // Dash Strike
              this.player.position.x += dir * 200;
              this.enemies.forEach(e => {
                  if (Math.abs(e.position.x - this.player!.position.x) < 80) {
                      this.damageEnemy(e, 40);
                      this.applyStatus(e, 'poisoned', 4, 10);
                  }
              });
              break;
          case 'm1': // Fire Burst
              this.createExplosion(this.player.position.x, this.player.position.y, 180, 70, '#ff4400');
              this.enemies.forEach(e => {
                  if (Math.abs(e.position.x - this.player!.position.x) < 180) this.applyStatus(e, 'burning', 5, 20);
              });
              break;
          case 'm2': // Ice Shard
              this.spawnProjectile(this.player.position, { x: dir * 15, y: 0 }, 'magic', 'player');
              break;
          case 'm3': // Arcane Wave
              this.enemies.forEach(e => {
                 const dx = e.position.x - this.player!.position.x;
                 if (Math.abs(dx) < 300 && Math.sign(dx) === dir) {
                     e.position.x += dir * 200;
                     this.applyStatus(e, 'stunned', 1.5);
                 }
              });
              break;
          case 'm4': // Blink
              this.player.position.x += dir * 300;
              this.addParticles(this.player.position, '#3b82f6', 20);
              break;
          case 'a1': // Power Shot
              this.spawnProjectile(this.player.position, { x: dir * 25, y: 0 }, 'arrow', 'player');
              break;
          case 'a2': // Multi Shot
              for (let i = -1; i <= 1; i++) {
                  const angle = (this.player.flipX ? Math.PI : 0) + i * 0.2;
                  this.spawnProjectile(this.player.position, { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 }, 'arrow', 'player');
              }
              break;
          case 'a3': // Roll
              this.player.position.x += dir * 180;
              break;
          case 'a4': // Explosive Arrow
              this.createExplosion(this.player!.position.x + dir * 200, this.player!.position.y, 150, 50, '#f97316');
              this.enemies.forEach(e => {
                const dist = Math.abs(e.position.x - (this.player!.position.x + dir * 200));
                if (dist < 150) this.applyStatus(e, 'burning', 4, 25);
              });
              break;
          case 'k5': // Guard Break
              this.enemies.forEach(e => {
                  const dx = e.position.x - this.player!.position.x;
                  if (Math.abs(dx) < 120 && Math.sign(dx) === dir) {
                      this.damageEnemy(e, 35);
                      this.applyStatus(e, 'stunned', 3);
                  }
              });
              break;
          case 'r2': // Poison Blade
              this.showNotification("BLADE ENVENOMED");
              this.enemies.forEach(e => {
                if (Math.abs(e.position.x - this.player!.position.x) < 100) this.applyStatus(e, 'poisoned', 10, 30);
              });
              break;
          case 'r3': // Shadow Step
              const nearest = this.enemies.sort((a,b) => {
                  const d1 = Math.abs(a.position.x - this.player!.position.x);
                  const d2 = Math.abs(b.position.x - this.player!.position.x);
                  return d1 - d2;
              })[0];
              if (nearest) {
                  this.player.position.x = nearest.position.x - dir * 50;
                  this.player.flipX = dir > 0 ? false : true;
                  this.applyStatus(nearest, 'poisoned', 5, 50);
              }
              break;
          case 'r5': // Backstab
              this.enemies.forEach(e => {
                  const dx = e.position.x - this.player!.position.x;
                  if (Math.abs(dx) < 80 && Math.sign(dx) === dir) this.damageEnemy(e, 80);
              });
              break;
          case 'm5': // Lightning Chain
              this.enemies.forEach(e => {
                  const dx = e.position.x - this.player!.position.x;
                  if (Math.abs(dx) < 400) this.damageEnemy(e, 40);
              });
              break;
          case 'a5': // Piercing Shot
              this.spawnProjectile(this.player.position, { x: dir * 30, y: 0 }, 'arrow', 'player');
              break;
          case 'ku': case 'ru': case 'mu': case 'au': // Ultimates
              this.showNotification("ULTIMATE TRIGGERED");
              this.addShake(30);
              this.createExplosion(this.player.position.x, this.player.position.y, 400, 150, '#ffffff');
              break;
      }
  }

  private createExplosion(x: number, y: number, radius: number, damage: number, color: string) {
      this.enemies.forEach(e => {
          const dx = e.position.x - x;
          const dy = e.position.y - y;
          if (Math.sqrt(dx*dx + dy*dy) < radius) this.damageEnemy(e, damage);
      });
      this.addParticles({ x, y }, color, 30);
  }

  private useSkill() {
      // Legacy or repurposed. Let's keep it as an "evade" or "utility" if needed, 
      // but the user wants the ability bar system. So I'll disable this and use useAbility(0) etc.
  }

  private getFloorName(): string {
      if (this.floor === 11) return "The Dark Warden";
      if (this.floor === 21) return "Arcane Sentinel";
      if (this.floor === 31) return "Throne of the King";
      return "Enemy Quarters";
  }

  private getEnemyCountForFloor(): number {
      if (this.floor === 11 || this.floor === 21 || this.floor === 31) return 1; // Boss floors
      return 3 + Math.floor(this.floor / 2);
  }

  private showNotification(text: string) {
      this.notification = text;
      this.notificationTimer = 2; // Shorter duration
  }

  handleResize() {
    // Canvas dimensions are handled in App.tsx but we might need to reposition player or something
    if (this.player) {
         // Keep player in bounds or something
    }
  }

  private loop(time: number) {
    if (!this.playing) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Hit Pause
    if (this.hitPauseTimer > 0) {
      this.hitPauseTimer -= dt;
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    this.update(Math.min(dt, 0.1)); // Cap dt for stability
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  private update(dt: number) {
    if (!this.player) return;

    // Camera follow player
    const targetCamX = -(this.player.position.x - this.canvas.width / 2);
    const targetCamY = -(this.player.position.y - this.canvas.height / 2);
    // Smooth camera if we wanted, but let's keep it simple
    this.cameraOffset.x = targetCamX;
    this.cameraOffset.y = targetCamY;

    // Update Player
    this.updatePlayer(dt);

    // Update Enemies
    this.updateEnemies(dt);

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Particles
    this.updateParticles(dt);

    // Cleanup
    this.projectiles = this.projectiles.filter(p => p.x > -1000 && p.x < 5000 && p.y > -1000 && p.y < 5000);
    this.particles = this.particles.filter(p => p.life > 0);

    // Screen Shake decay
    this.shakePower *= this.shakeDecay;
    if (this.shakePower < 0.1) this.shakePower = 0;

    // Update Abilities
    this.abilities.forEach(a => {
        if (a.currentCooldown > 0) a.currentCooldown -= dt;
    });

    // Notification Timer
    if (this.notificationTimer > 0) this.notificationTimer -= dt;

    // Spawning logic (Spawn in small groups)
    if (this.roomState === 'clearing' && this.enemies.length < 5 && this.enemiesToSpawn > 0) {
       // Spawn in sets of 2-3
       const setSize = Math.min(this.enemiesToSpawn, 2 + Math.floor(Math.random() * 2));
       for (let i = 0; i < setSize; i++) {
           this.spawnEnemy();
       }
    }

    // Key Collection
    if (this.roomState === 'dropped' && this.key && this.player) {
        const dx = this.key.x - this.player.position.x;
        const dy = this.key.y - this.player.position.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
            this.roomState = 'unlocked';
            this.showNotification("Key Collected: Exit Unlocked");
            this.addParticles({ x: this.key.x, y: this.key.y }, '#D4A017', 30);
        }
    }

    // Exit Transition
    if (this.roomState === 'unlocked' && this.player) {
        // Exit gate at top (y near -roomHeight/2)
        if (this.player.position.y < -this.roomHeight / 2 + 100) {
            this.nextRoom();
        }
    }
  }

  private nextRoom() {
      if (this.floor >= this.maxFloor) {
          this.towerCompleted = true;
          this.playing = false;
          return;
      }
      this.floor++;
      this.initializeRoom();
  }

  private updatePlayer(dt: number) {
    if (!this.player || this.player.state === 'death') return;

    // Movement
    let vx = 0;
    let vy = 0;
    const speed = this.playerClass === 'rogue' ? 350 : 250;

    if (this.keys['KeyW']) vy -= 1;
    if (this.keys['KeyS']) vy += 1;
    if (this.keys['KeyA']) vx -= 1;
    if (this.keys['KeyD']) vx += 1;

    if (vx !== 0 || vy !== 0) {
      const mag = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / mag) * speed;
      vy = (vy / mag) * speed;
      
      this.player.position.x += vx * dt;
      this.player.position.y += vy * dt;
      
      // Keep in room bounds
      this.player.position.x = Math.max(-this.roomWidth / 2 + 50, Math.min(this.roomWidth / 2 - 50, this.player.position.x));
      this.player.position.y = Math.max(-this.roomHeight / 2 + 50, Math.min(this.roomHeight / 2 - 50, this.player.position.y));
      
      if (this.player.state === 'idle') {
          this.player.state = 'run';
          this.player.stateTime = 0;
      }
    } else {
        if (this.player.state === 'run') {
            this.player.state = 'idle';
            this.player.stateTime = 0;
        }
    }

    this.player.flipX = this.mouse.x < this.canvas.width / 2;

    // Auto attacks (or manual)
    if (this.mouseDown && (this.player.state === 'idle' || this.player.state === 'run')) {
        this.player.state = 'attack';
        this.player.stateTime = 0;
        
        // Attack logic
        if (this.playerClass === 'mage' || this.playerClass === 'archer') {
             const angle = Math.atan2(this.mouse.y - this.canvas.height / 2, this.mouse.x - this.canvas.width / 2);
             this.spawnProjectile(this.player.position, { x: Math.cos(angle) * 12, y: Math.sin(angle) * 12 }, this.playerClass === 'mage' ? 'magic' : 'arrow', 'player');
        } else {
            // Melee check
            const range = 80;
            this.enemies.forEach(enemy => {
                 const dx = enemy.position.x - this.player!.position.x;
                 const dy = enemy.position.y - this.player!.position.y;
                 const dist = Math.sqrt(dx * dx + dy * dy);
                 if (dist < range) {
                     this.damageEnemy(enemy, 15);
                 }
            });
        }
    }

    // State timeouts
    if (this.player.state === 'attack' && this.player.stateTime > 0.3) {
        this.player.state = 'idle';
        this.player.stateTime = 0;
    }
    if (this.player.state === 'skill' && this.player.stateTime > 0.5) {
        this.player.state = 'idle';
        this.player.stateTime = 0;
    }
    if (this.player.state === 'hurt' && this.player.stateTime > 0.2) {
        this.player.state = 'idle';
        this.player.stateTime = 0;
    }

    this.player.update(dt);
  }

  private updateEnemies(dt: number) {
    if (!this.player) return;
    
    this.enemies.forEach(enemy => {
        if (enemy.health <= 0) {
             if (enemy.state !== 'death') {
                 enemy.state = 'death';
                 enemy.stateTime = 0;
                 this.score += 10;
                 this.addXp(20 + this.floor * 2);
                 this.enemiesDefeated++;
                 
                 // If last enemy, drop key
                 if (this.enemiesDefeated === this.totalEnemiesInRoom && this.roomState === 'clearing') {
                     this.roomState = 'dropped';
                     this.key = { x: enemy.position.x, y: enemy.position.y, active: true };
                     this.showNotification("Key Dropped");
                 }
             }
             enemy.update(dt);
             return;
        }

        const dx = this.player!.position.x - enemy.position.x;
        const dy = this.player!.position.y - enemy.position.y;
        const distToPlayer = Math.sqrt(dx*dx + dy*dy);
        
        // Ranged Mages/Archers logic
        const isRanged = enemy.charClass === 'mage' || enemy.charClass === 'archer';
        const attackRange = isRanged ? 400 : 60;
        
        if (distToPlayer > attackRange) {
            enemy.position.x += (dx / distToPlayer) * 120 * dt;
            enemy.position.y += (dy / distToPlayer) * 120 * dt;
            if (enemy.state === 'idle') enemy.state = 'run';
        } else {
             if (enemy.state !== 'attack' && enemy.state !== 'hurt') {
                 enemy.state = 'attack';
                 enemy.stateTime = 0;
                 
                 if (isRanged) {
                     const angle = Math.atan2(dy, dx);
                     this.spawnProjectile(enemy.position, { x: Math.cos(angle) * 8, y: Math.sin(angle) * 8 }, enemy.charClass === 'mage' ? 'magic' : 'arrow', 'enemy');
                 } else {
                     this.damagePlayer(8 + Math.floor(this.floor / 2));
                 }
             }
        }

        if (enemy.state === 'attack' && enemy.stateTime > 0.5) {
            enemy.state = 'idle';
            enemy.stateTime = 0;
        }
        if (enemy.state === 'hurt' && enemy.stateTime > 0.2) {
            enemy.state = 'idle';
            enemy.stateTime = 0;
        }

      enemy.update(dt);
    });

    // Apply Status Damage
    this.enemies.forEach(enemy => {
        enemy.effects.forEach(eff => {
            if (eff.damagePerSec) {
                enemy.health -= eff.damagePerSec * dt;
                if (Math.random() < 0.1) this.addParticles(enemy.position, eff.type === 'burning' ? '#ff4400' : '#00ff66', 1);
            }
        });
    });
    
    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.health > 0 || e.stateTime < 1);
  }

  private updateProjectiles(dt: number) {
    this.projectiles.forEach(p => {
        const moveX = p.vx * 60 * dt;
        const moveY = p.vy * 60 * dt;
        p.x += moveX;
        p.y += moveY;
        
        // Wall collision
        const hw = this.roomWidth / 2;
        const hh = this.roomHeight / 2;
        if (p.x < -hw || p.x > hw || p.y < -hh || p.y > hh) {
            p.x = -10000;
            return;
        }

        if (p.owner === 'player') {
             this.enemies.forEach(enemy => {
                 // Check multiple points (head, hips)
                 const dyHips = enemy.position.y - p.y;
                 const dxHips = enemy.position.x - p.x;
                 const distHips = Math.sqrt(dxHips*dxHips + dyHips*dyHips);
                 
                 const headY = enemy.position.y - 35; // Better offset for head based on Stickman.ts
                 const dyHead = headY - p.y;
                 const distHead = Math.sqrt(dxHips*dxHips + dyHead*dyHead);
                 
                 if (distHips < 35 || distHead < 20) {
                     this.damageEnemy(enemy, p.damage);
                     if (p.type === 'magic') this.applyStatus(enemy, 'chilled', 2);
                     p.x = -10000;
                 }
             });
        } else {
             const dyHips = this.player!.position.y - p.y;
             const dxHips = this.player!.position.x - p.x;
             const distHips = Math.sqrt(dxHips*dxHips + dyHips*dyHips);
             
             const headY = this.player!.position.y - 35;
             const dyHead = headY - p.y;
             const distHead = Math.sqrt(dxHips*dxHips + dyHead*dyHead);

             if (distHips < 35 || distHead < 20) {
                 this.damagePlayer(p.damage);
                 p.x = -10000;
             }
        }
    });
  }
  
  private updateParticles(dt: number) {
      this.particles.forEach(p => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 20 * dt; // Gravity
          p.life -= dt;
      });
  }

  private spawnEnemy() {
      // Spawn at edges of room random sides
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = (Math.random() - 0.5) * this.roomWidth; y = -this.roomHeight / 2 + 100; }
      else if (side === 1) { x = (Math.random() - 0.5) * this.roomWidth; y = this.roomHeight / 2 - 100; }
      else if (side === 2) { x = -this.roomWidth / 2 + 100; y = (Math.random() - 0.5) * this.roomHeight; }
      else { x = this.roomWidth / 2 - 100; y = (Math.random() - 0.5) * this.roomHeight; }
      
      // Select enemy class based on floor
      let cls = 'knight';
      if (this.floor >= 12 && Math.random() < 0.3) cls = 'archer';
      if (this.floor >= 22 && Math.random() < 0.2) cls = 'mage';
      if (this.floor === 11 || this.floor === 21 || this.floor === 31) cls = 'knight'; // Bosses are heavy knights
      
      const enemy = new Stickman({ x, y }, '#ff3366', cls) as any;
      
      // Scaled health
      const isBoss = this.floor === 11 || this.floor === 21 || this.floor === 31;
      const hpScale = isBoss ? 10 : 1;
      enemy.health = enemy.maxHealth = (40 + (this.floor * 15)) * hpScale;
      
      if (isBoss) {
          enemy.scale = 2; // Boss scale
          enemy.color = '#D4A017'; // Boss: highlight gold
          enemy.type = 'boss';
      } else {
          enemy.type = 'enemy';
      }
      
      this.enemies.push(enemy);
      this.enemiesToSpawn--;
  }

  private addXp(amount: number) {
      this.experience += amount;
      if (this.experience >= this.nextLevelXp) {
          this.experience -= this.nextLevelXp;
          this.level++;
          this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
          this.playerMaxHealth += 20;
          this.playerHealth = this.playerMaxHealth; // Heal on level up
          this.showNotification(`LEVEL UP: ${this.level}`);
          this.addParticles(this.player!.position, '#D4A017', 40);
          this.checkUnlocks();
      }
  }

  private spawnProjectile(pos: Vector2, vel: Vector2, type: 'arrow' | 'magic', owner: 'player' | 'enemy') {
      this.projectiles.push({
          x: pos.x,
          y: pos.y,
          vx: vel.x,
          vy: vel.y,
          type,
          owner,
          damage: type === 'magic' ? 20 : 12
      });
  }

  private damageEnemy(enemy: any, amount: number) {
      if (enemy.health <= 0) return;
      enemy.health -= amount;
      enemy.state = 'hurt';
      enemy.stateTime = 0;
      enemy.hitFlash = 1;

      if (this.playerClass === 'mage' && Math.random() < 0.2) this.applyStatus(enemy, 'chilled', 2);
      
      // Knockback
      const dx = enemy.position.x - this.player!.position.x;
      const dy = enemy.position.y - this.player!.position.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 0) {
          enemy.position.x += (dx / dist) * 30;
          enemy.position.y += (dy / dist) * 30;
      }
      
      this.addShake(3);
      this.addParticles(enemy.position, '#ff3366', 5);
      this.hitPause(0.05);
  }

  private damagePlayer(amount: number) {
      if (!this.player || this.player.state === 'death') return;
      this.playerHealth -= amount;
      this.player.state = 'hurt';
      this.player.stateTime = 0;
      this.player.hitFlash = 1;
      this.addShake(8);
      this.addParticles(this.player.position, '#ffffff', 8);
      this.hitPause(0.1);
      
      if (this.playerHealth <= 0) {
          this.playerHealth = 0;
          this.player.state = 'death';
          this.player.stateTime = 0;
      }
  }

  private addParticles(pos: Vector2, color: string, count: number) {
      for (let i = 0; i < count; i++) {
          this.particles.push({
              x: pos.x,
              y: pos.y,
              vx: (Math.random() - 0.5) * 400,
              vy: (Math.random() - 0.5) * 400,
              life: 0.5 + Math.random() * 0.5,
              maxLife: 1,
              color,
              size: 2 + Math.random() * 4
          });
      }
  }

  private addShake(power: number) {
      this.shakePower += power;
  }

  private hitPause(dur: number) {
      this.hitPauseTimer = dur;
  }

  private applyStatus(enemy: any, type: string, duration: number, dps?: number) {
      const existing = enemy.effects.find((e: any) => e.type === type);
      if (existing) {
          existing.duration = Math.max(existing.duration, duration);
      } else {
          enemy.effects.push({ type, duration, damagePerSec: dps });
      }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    
    // Apply Shake
    if (this.shakePower > 0) {
        this.ctx.translate((Math.random() - 0.5) * this.shakePower, (Math.random() - 0.5) * this.shakePower);
    }
    
    // Camera Transform
    this.ctx.translate(this.cameraOffset.x, this.cameraOffset.y);
    
    // Navigation Arrows
    this.drawNavArrows();

    // Draw Ground Grid (Immersive)
    this.drawGrid();

    // Draw Exit Gate
    const hw = this.roomWidth / 2;
    const hh = this.roomHeight / 2;
    
    // Top Exit Gate — flat colors, no glow
    const exitOpen = this.roomState === 'unlocked';
    this.ctx.fillStyle = exitOpen ? '#22C55E' : '#1F2937';
    this.ctx.fillRect(-150, -hh, 300, 36);
    this.ctx.strokeStyle = exitOpen ? '#22C55E' : '#374151';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-150, -hh, 300, 36);
    // Exit label
    this.ctx.fillStyle = exitOpen ? '#111827' : '#4B5563';
    this.ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(exitOpen ? 'EXIT' : '[ LOCKED ]', 0, -hh + 22);

    // Draw Particles
    this.particles.forEach(p => {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life / p.maxLife;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;

    // Draw Key — flat diamond shape
    if (this.roomState === 'dropped' && this.key) {
        const kx = this.key.x, ky = this.key.y;
        // Diamond
        this.ctx.fillStyle = '#D4A017';
        this.ctx.beginPath();
        this.ctx.moveTo(kx, ky - 12);
        this.ctx.lineTo(kx + 9, ky);
        this.ctx.lineTo(kx, ky + 12);
        this.ctx.lineTo(kx - 9, ky);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#E5E7EB';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        // Label
        this.ctx.fillStyle = '#D4A017';
        this.ctx.font = '10px "IBM Plex Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('KEY', kx, ky - 18);
    }

    // Exit direction arrow — flat, no glow
    if (this.roomState === 'unlocked' && this.player) {
        this.ctx.fillStyle = '#22C55E';
        this.ctx.font = 'bold 12px "IBM Plex Mono", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('↑ EXIT', this.player.position.x, this.player.position.y - 80);
    }

    // Draw Projectiles
    this.projectiles.forEach(pr => {
        this.ctx.fillStyle = pr.type === 'magic' ? '#60a5fa' : '#d1d5db';
        this.ctx.beginPath();
        if (pr.type === 'arrow') {
            const angle = Math.atan2(pr.vy, pr.vx);
            this.ctx.save();
            this.ctx.translate(pr.x, pr.y);
            this.ctx.rotate(angle);
            this.ctx.fillRect(-10, -2, 20, 4);
            this.ctx.restore();
        } else {
            this.ctx.arc(pr.x, pr.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    });

    // Draw Enemies + Health bars
    this.enemies.forEach(enemy => {
        enemy.draw(this.ctx);
        if (enemy.health > 0 && enemy.maxHealth > 0) {
            const isBoss = (enemy as any).type === 'boss';
            const bw = isBoss ? 80 : 36;
            const bh = isBoss ? 6 : 4;
            const bx = enemy.position.x - bw / 2;
            const by = enemy.position.y - (isBoss ? 90 : 65) * enemy.scale;
            const pct = Math.max(0, enemy.health / enemy.maxHealth);
            // Track
            this.ctx.fillStyle = '#1F2937';
            this.ctx.fillRect(bx, by, bw, bh);
            // Fill
            this.ctx.fillStyle = isBoss ? '#EF4444' : '#EF4444';
            this.ctx.fillRect(bx, by, bw * pct, bh);
            // Border
            this.ctx.strokeStyle = '#374151';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(bx, by, bw, bh);
        }
    });

    // Draw Player
    if (this.player) {
      this.player.draw(this.ctx);
    }

    this.ctx.restore();
  }

  private drawNavArrows() {
    if (this.roomState === 'clearing' || !this.player) return;

    let target: Vector2 | null = null;
    if (this.roomState === 'dropped' && this.key) {
        target = { x: this.key.x, y: this.key.y };
    } else if (this.roomState === 'unlocked') {
        target = { x: 0, y: -this.roomHeight / 2 + 100 };
    }

    if (target) {
        const dx = target.x - this.player.position.x;
        const dy = target.y - this.player.position.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 150) {
            this.ctx.save();
            this.ctx.translate(this.player.position.x, this.player.position.y);
            this.ctx.rotate(angle);
            
            this.ctx.strokeStyle = this.roomState === 'dropped' ? '#D4A017' : '#22C55E';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(70, 0);
            this.ctx.lineTo(54, -8);
            this.ctx.moveTo(70, 0);
            this.ctx.lineTo(54, 8);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
  }

  private drawGrid() {
      const tileSize = 80;
      const hw = this.roomWidth / 2;
      const hh = this.roomHeight / 2;

      // Alternating dark floor tiles for clean pixel look
      for (let gx = -hw; gx < hw; gx += tileSize) {
          for (let gy = -hh; gy < hh; gy += tileSize) {
              const col = Math.round((gx + hw) / tileSize);
              const row = Math.round((gy + hh) / tileSize);
              this.ctx.fillStyle = (col + row) % 2 === 0 ? '#131924' : '#111827';
              this.ctx.fillRect(gx, gy, tileSize, tileSize);
          }
      }

      // Wall outline — flat, no glow
      this.ctx.strokeStyle = '#E5E7EB';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(-hw, -hh, this.roomWidth, this.roomHeight);

      // Inner inset for depth
      this.ctx.strokeStyle = '#374151';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(-hw + 8, -hh + 8, this.roomWidth - 16, this.roomHeight - 16);
  }

  destroy() {
    this.playing = false;
    cancelAnimationFrame(this.animationFrameId);
  }
}
