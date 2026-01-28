import { createCanvas } from 'canvas';
import crypto from 'crypto';

class CreatureGenerator {
  constructor() {
    this.elements = [
      'Fire', 'Water', 'Grass', 'Electric', 'Ice', 
      'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 
      'Bug', 'Dragon'
    ];
    
    this.prefixes = [
      'Spark', 'Shadow', 'Crystal', 'Flame', 'Aqua', 
      'Thunder', 'Geo', 'Psy', 'Venom', 'Frost',
      'Solar', 'Lunar', 'Nova', 'Void', 'Star'
    ];
    
    this.suffixes = [
      'mon', 'beast', 'ling', 'rex', 'nite',
      'saur', 'dactyl', 'chu', 'vee', 'gatr',
      'mite', 'puff', 'claw', 'wing', 'fin'
    ];
    
    this.colors = {
      Fire: ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B'],
      Water: ['#2196F3', '#03A9F4', '#00BCD4', '#009688'],
      Grass: ['#4CAF50', '#8BC34A', '#CDDC39', '#795548'],
      Electric: ['#FFEB3B', '#FFC107', '#FF9800', '#FFFFFF'],
      Ice: ['#00BCD4', '#E0F7FA', '#B2EBF2', '#FFFFFF'],
      Fighting: ['#795548', '#8D6E63', '#A1887F', '#3E2723'],
      Poison: ['#9C27B0', '#E1BEE7', '#BA68C8', '#4A148C'],
      Ground: ['#8D6E63', '#795548', '#5D4037', '#D7CCC8'],
      Flying: ['#90CAF9', '#BBDEFB', '#E3F2FD', '#FFFFFF'],
      Psychic: ['#E91E63', '#F48FB1', '#F8BBD9', '#880E4F'],
      Bug: ['#8BC34A', '#CDDC39', '#AFB42B', '#33691E'],
      Dragon: ['#673AB7', '#9575CD', '#B39DDB', '#311B92'],
    };
  }

  generateCreature(address, walletData) {
    // Generate DNA from address + wallet data
    const dna = this.generateDNA(address, walletData);
    const dnaBigInt = BigInt('0x' + dna);
    
    // Determine element from DNA
    const elementIndex = Number(dnaBigInt % BigInt(12));
    const element = this.elements[elementIndex];
    
    // Calculate stats from DNA
    const stats = this.calculateStats(dnaBigInt, walletData);
    
    // Generate name
    const species = this.generateSpeciesName(dnaBigInt, element);
    const name = this.generateUniqueName(species, address);
    
    return {
      name,
      species,
      dna: dna,
      element,
      level: stats.level,
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      special: stats.special,
      description: this.generateDescription(element, walletData.archetype),
      colorPalette: this.colors[element],
    };
  }

  generateDNA(address, walletData) {
    const data = `${address}-${walletData.transactionCount}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  calculateStats(dna, walletData) {
    // Base stats from DNA (1-100 range)
    const getStat = (shift) => Number((dna >> BigInt(shift)) % BigInt(100)) + 1;
    
    // Modify stats based on wallet archetype
    const archetypeModifiers = {
      'Whale Collector': { hp: 1.3, attack: 1.1, defense: 1.2 },
      'Degen Trader': { speed: 1.4, attack: 1.2, hp: 0.8 },
      'DeFi Farmer': { hp: 1.2, defense: 1.2, special: 1.2 },
      'NFT Flipper': { speed: 1.3, special: 1.2 },
      'Hodler': { defense: 1.3, hp: 1.2 },
      'Newbie': { hp: 0.9, attack: 0.9 },
      'Adventurer': {},
    };
    
    const mods = archetypeModifiers[walletData.archetype] || {};
    
    return {
      level: 1,
      hp: Math.min(Math.floor(getStat(0) * (mods.hp || 1)), 100),
      attack: Math.min(Math.floor(getStat(8) * (mods.attack || 1)), 100),
      defense: Math.min(Math.floor(getStat(16) * (mods.defense || 1)), 100),
      speed: Math.min(Math.floor(getStat(24) * (mods.speed || 1)), 100),
      special: Math.min(Math.floor(getStat(32) * (mods.special || 1)), 100),
    };
  }

  generateSpeciesName(dna, element) {
    const prefixIndex = Number(dna % BigInt(this.prefixes.length));
    const suffixIndex = Number((dna >> BigInt(8)) % BigInt(this.suffixes.length));
    
    // Sometimes add element to name
    if (Number(dna % BigInt(3)) === 0) {
      return `${element}${this.suffixes[suffixIndex]}`;
    }
    
    return `${this.prefixes[prefixIndex]}${this.suffixes[suffixIndex]}`;
  }

  generateUniqueName(species, address) {
    const shortAddr = address.slice(-4);
    return `${species} #${shortAddr}`;
  }

  generateDescription(element, archetype) {
    const descriptions = {
      'Whale Collector': `A majestic ${element.toLowerCase()}-type creature born from deep waters of wealth.`,
      'Degen Trader': `A volatile ${element.toLowerCase()}-type that thrives on market chaos.`,
      'DeFi Farmer': `A nurturing ${element.toLowerCase()}-type that harvests yield from the digital fields.`,
      'NFT Flipper': `A swift ${element.toLowerCase()}-type with an eye for rare treasures.`,
      'Hodler': `A resilient ${element.toLowerCase()}-type that stands firm through any storm.`,
      'Newbie': `A young ${element.toLowerCase()}-type just beginning its blockchain journey.`,
      'Adventurer': `A curious ${element.toLowerCase()}-type exploring the unknown reaches of the chain.`,
    };
    
    return descriptions[archetype] || `A mysterious ${element.toLowerCase()}-type creature.`;
  }

  async generatePixelArt(creature) {
    const size = 256;
    const pixelSize = 8;
    const gridSize = size / pixelSize;
    
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = false;
    
    // Fill background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);
    
    const colors = creature.colorPalette;
    const dna = BigInt('0x' + creature.dna);
    
    // Draw background pattern
    this.drawBackground(ctx, creature.element, size, dna);
    
    // Draw creature body
    this.drawCreature(ctx, creature, gridSize, pixelSize, colors, dna);
    
    // Add pixel grid overlay
    this.drawPixelGrid(ctx, size, pixelSize);
    
    return canvas.toBuffer('image/png');
  }

  drawBackground(ctx, element, size, dna) {
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    const bgColors = {
      Fire: ['#3E2723', '#1a1a2e'],
      Water: ['#0D47A1', '#1a1a2e'],
      Grass: ['#1B5E20', '#1a1a2e'],
      Electric: ['#F57F17', '#1a1a2e'],
      Ice: ['#006064', '#1a1a2e'],
      Fighting: ['#3E2723', '#1a1a2e'],
      Poison: ['#4A148C', '#1a1a2e'],
      Ground: ['#3E2723', '#1a1a2e'],
      Flying: ['#0D47A1', '#1a1a2e'],
      Psychic: ['#880E4F', '#1a1a2e'],
      Bug: ['#33691E', '#1a1a2e'],
      Dragon: ['#311B92', '#1a1a2e'],
    };
    
    const [inner, outer] = bgColors[element] || ['#1a1a2e', '#0f0f1a'];
    gradient.addColorStop(0, inner + '40');
    gradient.addColorStop(1, outer);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  drawCreature(ctx, creature, gridSize, pixelSize, colors, dna) {
    const centerX = gridSize / 2;
    const centerY = gridSize / 2;
    
    let seed = Number(dna % BigInt(1000000));
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    
    const size = Math.floor(8 + (creature.hp / 100) * 6);
    const height = Math.floor(8 + (creature.attack / 100) * 8);
    const width = Math.floor(8 + (creature.defense / 100) * 6);
    
    const bodyColor = colors[0];
    const bodyShadow = this.darkenColor(bodyColor, 30);
    
    for (let y = -height / 2; y < height / 2; y++) {
      for (let x = -width / 2; x < width / 2; x++) {
        const dist = (x * x) / ((width / 2) ** 2) + (y * y) / ((height / 2) ** 2);
        if (dist <= 1) {
          const pixelX = (centerX + x) * pixelSize;
          const pixelY = (centerY + y) * pixelSize;
          
          if (random() > 0.1) {
            ctx.fillStyle = dist < 0.6 ? bodyColor : bodyShadow;
            ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
          }
        }
      }
    }
    
    // Draw eyes
    const eyeSize = Math.floor(2 + (creature.speed / 100) * 2);
    const eyeOffset = Math.floor(width / 4);
    const eyeY = centerY - height / 4;
    
    this.drawEye(ctx, (centerX - eyeOffset) * pixelSize, eyeY * pixelSize, eyeSize * pixelSize, colors);
    this.drawEye(ctx, (centerX + eyeOffset) * pixelSize, eyeY * pixelSize, eyeSize * pixelSize, colors);
    
    // Draw element features
    this.drawElementFeatures(ctx, creature.element, centerX, centerY, width, height, pixelSize, colors, random);
    
    // Draw accessories
    this.drawAccessories(ctx, creature, centerX, centerY, pixelSize, random);
  }

  drawEye(ctx, x, y, size, colors) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - size / 4, y - size / 4, size / 2, size / 2);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - size / 4, y - size / 4, size / 4, size / 4);
  }

  drawElementFeatures(ctx, element, cx, cy, w, h, ps, colors, random) {
    const featureColor = colors[1];
    
    switch (element) {
      case 'Fire':
        for (let i = 0; i < 3; i++) {
          const fx = (cx + (i - 1) * 3) * ps;
          const fy = (cy - h / 2 - 2 - i) * ps;
          ctx.fillStyle = featureColor;
          ctx.fillRect(fx, fy, ps * 2, ps * (3 + i));
        }
        break;
        
      case 'Water':
        for (let i = 0; i < 2; i++) {
          const side = i === 0 ? -1 : 1;
          for (let j = 0; j < 4; j++) {
            ctx.fillStyle = featureColor;
            ctx.fillRect(
              (cx + side * (w / 2 + j)) * ps,
              (cy - 2 + j) * ps,
              ps, ps
            );
          }
        }
        break;
        
      case 'Electric':
        ctx.fillStyle = '#FFEB3B';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect((cx - 2 + i) * ps, (cy - h / 2 - 3) * ps, ps, ps * 2);
        }
        break;
        
      case 'Dragon':
        ctx.fillStyle = colors[3];
        for (let i = 0; i < 2; i++) {
          const side = i === 0 ? -1 : 1;
          for (let j = 0; j < 5; j++) {
            ctx.fillRect(
              (cx + side * (3 + j)) * ps,
              (cy - h / 2 - 1 - j) * ps,
              ps, ps
            );
          }
        }
        break;
        
      default:
        for (let i = 0; i < 2; i++) {
          const side = i === 0 ? -1 : 1;
          ctx.fillStyle = featureColor;
          ctx.fillRect(
            (cx + side * (w / 2 + 1)) * ps,
            (cy - h / 3) * ps,
            ps * 2, ps * 3
          );
        }
    }
  }

  drawAccessories(ctx, creature, cx, cy, ps, random) {
    if (creature.special > 70) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect((cx - 1) * ps, (cy - 6) * ps, ps * 3, ps);
      ctx.fillRect(cx * ps, (cy - 7) * ps, ps, ps);
    }
  }

  drawPixelGrid(ctx, size, pixelSize) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= size; i += pixelSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
  }

  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min((num >> 16) + amt, 255);
    const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
    const B = Math.min((num & 0x0000FF) + amt, 255);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}

export default new CreatureGenerator();
