/**
 * Ink & Iron: Sketch Warfare — UnitIcons Module
 * Pure Procedural SVG & Path2D Iconography Engine
 * Provides bespoke dieselpunk tactical badges, field-manual silhouettes,
 * and high-performance canvas tokens across the entire application.
 */

(function(global) {
  'use strict';

  // 48x48 Base Viewport Vector Silhouettes (High-contrast military ink silhouettes)
  const SILHOUETTES = {
    RIFLEMAN: {
      id: 'RIFLEMAN',
      name: 'Rifle Squad',
      category: 'INFANTRY',
      viewBox: '0 0 48 48',
      // Trench infantryman in Brodie/Stahlhelm helmet with bayoneted rifles crossed
      pathData: `
        M24 7 C21 7 18 9 17 12 C16 13 14 13.5 13 14 C12 14.5 13 15.5 15 15.5 C16 15.5 17 15 18 14.8 C19 16.5 21.2 17.5 24 17.5 C26.8 17.5 29 16.5 30 14.8 C31 15 32 15.5 33 15.5 C35 15.5 36 14.5 35 14 C34 13.5 32 13 31 12 C30 9 27 7 24 7 Z
        M21 18 C20 18 19 19 19 20 C19 21.2 20 22 21 22.5 L21 24 L27 24 L27 22.5 C28 22 29 21.2 29 20 C29 19 28 18 27 18 Z
        M14 25 C12 26 11 28 10 32 L12 34 L15 30 L16 34 L18 34 L18 26 Z
        M34 25 C36 26 37 28 38 32 L36 34 L33 30 L32 34 L30 34 L30 26 Z
        M19 25 L29 25 L28 37 L20 37 Z
        M9 43 L12 43 L15 34 L12 34 Z
        M39 43 L36 43 L33 34 L36 34 Z
        M10 11 L14 15 L22 23 L20 25 L12 17 L8 17 L7 14 L10 11 Z
        M38 11 L34 15 L26 23 L28 25 L36 17 L40 17 L41 14 L38 11 Z
        M6 7 L8 9 L10 7 L9 5 Z
        M42 7 L40 9 L38 7 L39 5 Z
      `
    },
    SCOUT: {
      id: 'SCOUT',
      name: 'Scout Infantry',
      category: 'INFANTRY',
      viewBox: '0 0 48 48',
      // Crouched recon scout with prism binoculars and directional optics reticle
      pathData: `
        M24 6 C20 6 17 8 16 11 C15 12 13 13 11 13 C10 14 11 15 13 15 C14 15 15.5 14.5 16.5 14 C17.5 15.5 20.5 16.5 24 16.5 C27.5 16.5 30.5 15.5 31.5 14 C32.5 14.5 34 15 35 15 C37 15 38 14 37 13 C35 13 33 12 32 11 C31 8 28 6 24 6 Z
        M14 17 C11.8 17 10 18.8 10 21 C10 23.2 11.8 25 14 25 C15.5 25 16.8 24.2 17.5 23 L20 23 L20 19 L17.5 19 C16.8 17.8 15.5 17 14 17 Z
        M34 17 C36.2 17 38 18.8 38 21 C38 23.2 36.2 25 34 25 C32.5 25 31.2 24.2 30.5 23 L28 23 L28 19 L30.5 19 C31.2 17.8 32.5 17 34 17 Z
        M21 20 L27 20 L27 22 L21 22 Z
        M14 19.5 C14.8 19.5 15.5 20.2 15.5 21 C15.5 21.8 14.8 22.5 14 22.5 C13.2 22.5 12.5 21.8 12.5 21 C12.5 20.2 13.2 19.5 14 19.5 Z
        M34 19.5 C34.8 19.5 35.5 20.2 35.5 21 C35.5 21.8 34.8 22.5 34 22.5 C33.2 22.5 32.5 21.8 32.5 21 C32.5 20.2 33.2 19.5 34 19.5 Z
        M16 26 L32 26 L30 35 L26 35 L25 41 L23 41 L22 35 L18 35 Z
        M12 28 L15 28 L15 36 L12 40 Z
        M36 28 L33 28 L33 36 L36 40 Z
        M31 10 L37 4 L38 5 L33 11 Z
      `
    },
    ANTI_TANK: {
      id: 'ANTI_TANK',
      name: 'Anti-Tank Crew',
      category: 'INFANTRY',
      viewBox: '0 0 48 48',
      // Heavy recoilless anti-tank gun and kinetic finned sabot penetrator shell
      pathData: `
        M7 22 L27 22 L27 20 L31 20 L31 22 L37 22 L37 19 L41 19 L41 27 L37 27 L37 24 L31 24 L31 26 L27 26 L27 24 L7 24 Z
        M5 19 L8 19 L8 27 L5 27 Z
        M14 24 L10 37 L14 38 L17 26 Z
        M22 24 L21 38 L25 38 L25 25 Z
        M30 24 L33 26 L36 38 L32 38 Z
        M24 8 L27 13 L25 13 L25 18 L23 18 L23 13 L21 13 Z
        M19 14 L20 18 L18 18 Z
        M29 14 L30 18 L28 18 Z
        M18 39 L30 39 L28 41 L20 41 Z
        M16 27 C16 29 18 30 20 30 C22 30 24 29 24 27 Z
      `
    },
    LIGHT_VEHICLE: {
      id: 'LIGHT_VEHICLE',
      name: 'Light Armored Car',
      category: 'VEHICLE',
      viewBox: '0 0 48 48',
      // Sloped 4-wheel dieselpunk armored scout car with revolving gun turret
      pathData: `
        M23 12 L28 12 L28 10 L37 10 L37 12 L29 12 C30 14 30 16 29 17 L36 20 C39 21.5 41 23.5 41 26 L42 30 L40 33 L38 33 C37.5 30 35 28 32 28 C29 28 26.5 30 26 33 L18 33 C17.5 30 15 28 12 28 C9 28 6.5 30 6 33 L4 33 L4 28 C4 26 6 24 8 23 L18 18 C19.5 15 21 13 23 12 Z
        M21 14 C21 13 23 12 26 12 C28 12 29 13 29 14 L29 17 L21 17 Z
        M12 29 C14.2 29 16 30.8 16 33 C16 35.2 14.2 37 12 37 C9.8 37 8 35.2 8 33 C8 30.8 9.8 29 12 29 Z
        M32 29 C34.2 29 36 30.8 36 33 C36 35.2 34.2 37 32 37 C29.8 37 28 35.2 28 33 C28 30.8 29.8 29 32 29 Z
        M12 31.5 C12.8 31.5 13.5 32.2 13.5 33 C13.5 33.8 12.8 34.5 12 34.5 C11.2 34.5 10.5 33.8 10.5 33 C10.5 32.2 11.2 31.5 12 31.5 Z
        M32 31.5 C32.8 31.5 33.5 32.2 33.5 33 C33.5 33.8 32.8 34.5 32 34.5 C31.2 34.5 30.5 33.8 30.5 33 C30.5 32.2 31.2 31.5 32 31.5 Z
        M17 22 L24 22 L24 25 L16 25 Z
      `
    },
    HEAVY_SIEGE_TANK: {
      id: 'HEAVY_SIEGE_TANK',
      name: 'Heavy Siege Tank',
      category: 'VEHICLE',
      viewBox: '0 0 48 48',
      // Massive multi-turret Iron Corps dreadnought tank with high treads and twin stacks
      pathData: `
        M22 9 L28 9 L28 12 L43 12 L43 15 L28 15 L28 17 L18 17 L18 13 L22 13 Z
        M44 11 L46 11 L46 16 L44 16 Z
        M13 11 L15 11 L15 16 L13 16 Z
        M10 11 L12 11 L12 16 L10 16 Z
        M16 17 L31 17 C35 17 38 19 39 23 L42 26 C43 27 43 29 41 29 L39 29 C38 27 34 26 29 26 L12 26 C8 26 5 28 4 30 L3 26 C3 23 5 20 8 19 L16 17 Z
        M3 29 L43 29 C45 29 46 31 46 33 L45 36 C44 38 42 39 39 39 L8 39 C5 39 3 38 2 36 L1 33 C1 31 2 29 3 29 Z
        M7 31 C8.7 31 10 32.3 10 34 C10 35.7 8.7 37 7 37 C5.3 37 4 35.7 4 34 C4 32.3 5.3 31 7 31 Z
        M15 31 C16.7 31 18 32.3 18 34 C18 35.7 16.7 37 15 37 C13.3 37 12 35.7 12 34 C12 32.3 13.3 31 15 31 Z
        M23 31 C24.7 31 26 32.3 26 34 C26 35.7 24.7 37 23 37 C21.3 37 20 35.7 20 34 C20 32.3 21.3 31 23 31 Z
        M31 31 C32.7 31 34 32.3 34 34 C34 35.7 32.7 37 31 37 C29.3 37 28 35.7 28 34 C28 32.3 29.3 31 31 31 Z
        M39 31 C40.7 31 42 32.3 42 34 C42 35.7 40.7 37 39 37 C37.3 37 36 35.7 36 34 C36 32.3 37.3 31 39 31 Z
        M10 20 L13 20 L13 23 L10 23 Z
        M34 21 L37 21 L37 24 L34 24 Z
      `
    },
    BLITZ_RECON: {
      id: 'BLITZ_RECON',
      name: 'Blitz Recon Vehicle',
      category: 'VEHICLE',
      viewBox: '0 0 48 48',
      // Aerodynamic Vanguard raider half-track with swept speed cowl and autocannon
      pathData: `
        M24 9 L31 9 L31 12 L41 12 L41 14 L31 14 L30 17 L22 17 L22 13 L24 13 Z
        M18 14 L21 9 L23 10 L20 15 Z
        M14 17 L29 17 C32 17 35 18 37 21 L43 25 C44 26 44 28 42 29 L38 29 C37 27 34 26 31 26 L12 26 C9 26 7 27 6 29 L4 29 C3 27 4 24 6 22 L11 18 L14 17 Z
        M5 30 L23 30 C24.5 30 25 31 25 32 L25 36 C25 37 24.5 38 23 38 L5 38 C3.5 38 3 37 3 36 L3 32 C3 31 3.5 30 5 30 Z
        M7 32 C8.1 32 9 32.9 9 34 C9 35.1 8.1 36 7 36 C5.9 36 5 35.1 5 34 C5 32.9 5.9 32 7 32 Z
        M14 32 C15.1 32 16 32.9 16 34 C16 35.1 15.1 36 14 36 C12.9 36 12 35.1 12 34 C12 32.9 12.9 32 14 32 Z
        M21 32 C22.1 32 23 32.9 23 34 C23 35.1 22.1 36 21 36 C19.9 36 19 35.1 19 34 C19 32.9 19.9 32 21 32 Z
        M35 29 C37.8 29 40 31.2 40 34 C40 36.8 37.8 39 35 39 C32.2 39 30 36.8 30 34 C30 31.2 32.2 29 35 29 Z
        M35 31.5 C36.4 31.5 37.5 32.6 37.5 34 C37.5 35.4 36.4 36.5 35 36.5 C33.6 36.5 32.5 35.4 32.5 34 C32.5 32.6 33.6 31.5 35 31.5 Z
        M14 20 L20 20 L23 23 L17 23 Z
        M25 20 L28 20 L30 23 L27 23 Z
      `
    }
  };

  // Pre-compiled Canvas Path2D objects for ultra-fast zero-latency map rendering
  const PATH2D_CACHE = {};

  function getPath2D(typeKey) {
    if (typeof Path2D === 'undefined') return null;
    if (!PATH2D_CACHE[typeKey]) {
      const def = SILHOUETTES[typeKey] || SILHOUETTES.RIFLEMAN;
      try {
        PATH2D_CACHE[typeKey] = new Path2D(def.pathData.trim());
      } catch (e) {
        console.warn(`[UnitIcons] Failed to compile Path2D for ${typeKey}:`, e);
        return null;
      }
    }
    return PATH2D_CACHE[typeKey];
  }

  // Pre-compile on load if browser supports Path2D
  if (typeof Path2D !== 'undefined') {
    Object.keys(SILHOUETTES).forEach(key => getPath2D(key));
  }

  const UnitIcons = {
    SILHOUETTES,

    /**
     * Get clean inline SVG for a unit's silhouette
     */
    getSvg(typeKey, options = {}) {
      const def = SILHOUETTES[typeKey] || SILHOUETTES.RIFLEMAN;
      const size = options.size || 24;
      const color = options.color || 'currentColor';
      const className = options.class || '';

      return `
        <svg class="unit-svg-silhouette ${className}" width="${size}" height="${size}" viewBox="${def.viewBox}" fill="${color}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="${def.pathData.trim().replace(/\s+/g, ' ')}" fill-rule="evenodd" />
        </svg>
      `;
    },

    /**
     * Get a complete dual-layer Dieselpunk Tactical Insignia Badge
     * @param {string} typeKey - 'RIFLEMAN', 'SCOUT', 'ANTI_TANK', 'LIGHT_VEHICLE', 'HEAVY_SIEGE_TANK', 'BLITZ_RECON'
     * @param {object} options - { size: 'xs'|'sm'|'md'|'lg'|'xl', owner: 1|2, factionId: string, showRole: boolean, class: string }
     */
    getBadgeHtml(typeKey, options = {}) {
      const def = SILHOUETTES[typeKey] || SILHOUETTES.RIFLEMAN;
      const sizeClass = options.size ? `badge-${options.size}` : 'badge-md';
      const ownerClass = options.owner === 2 ? 'badge-enemy' : (options.owner === 1 ? 'badge-allied' : 'badge-neutral');
      const extraClass = options.class || '';
      const isVehicle = def.category === 'VEHICLE';

      // Dimensions mapping for inner SVG
      const sizePixelMap = { xs: 16, sm: 22, md: 30, lg: 44, xl: 58 };
      const svgPx = sizePixelMap[options.size] || 30;

      const roleBadge = options.showRole ? `
        <span class="tactical-badge-role-tag ${isVehicle ? 'role-vehicle' : 'role-infantry'}">
          ${isVehicle ? 'VEH' : 'INF'}
        </span>
      ` : '';

      return `
        <div class="tactical-badge ${sizeClass} ${ownerClass} ${isVehicle ? 'frame-vehicle' : 'frame-infantry'} ${extraClass}" data-unit-type="${typeKey}" title="${def.name}">
          <div class="tactical-badge-rim"></div>
          <div class="tactical-badge-glow"></div>
          <div class="tactical-badge-inner">
            ${this.getSvg(typeKey, { size: svgPx, color: 'currentColor' })}
          </div>
          ${roleBadge}
        </div>
      `;
    },

    /**
     * High-Performance Canvas Map Token Drawer
     * Draws the tactical token with micro-silhouette, brass rim, rivets, and health arc on the battlefield canvas
     */
    drawCanvasToken(ctx, unit, cx, cy, engine, options = {}) {
      ctx.save();
      const isP1 = unit.owner === 1;
      const isVehicle = unit.category === 'VEHICLE';
      const uType = unit.typeKey || unit.id || 'RIFLEMAN';

      // Team colors
      const teamPrimary = isP1 ? '#2563eb' : '#dc2626';
      const teamLight = isP1 ? '#93c5fd' : '#fca5a5';
      const teamGlow = isP1 ? 'rgba(37, 99, 235, 0.45)' : 'rgba(220, 38, 38, 0.45)';

      // Token dimensions
      const radius = isVehicle ? 22 : 20;

      // 1. Drop shadow & glow
      ctx.shadowColor = teamGlow;
      ctx.shadowBlur = unit.isSelected ? 14 : 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // 2. Outer Tactical Token Base Plate
      ctx.beginPath();
      if (isVehicle) {
        ctx.ellipse(cx, cy, radius + 3, radius - 2, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      }
      ctx.fillStyle = isP1 ? '#090d19' : '#1a0808';
      ctx.fill();

      // Reset shadow for crisp borders
      ctx.shadowBlur = 0;

      // 3. Metallic Worn Brass Rim & Team Color Contour
      ctx.lineWidth = unit.isSelected ? 3 : 2;
      ctx.strokeStyle = teamPrimary;
      ctx.stroke();

      // Inner tactical bevel rim
      ctx.beginPath();
      if (isVehicle) {
        ctx.ellipse(cx, cy, radius + 1, radius - 4, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; // Brass accent
      ctx.stroke();

      // 4. Perimeter Rivets / Pips
      ctx.fillStyle = teamPrimary;
      const pipDist = isVehicle ? radius + 1 : radius - 1;
      [ [0, -pipDist], [0, pipDist], [-pipDist, 0], [pipDist, 0] ].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(cx + px, cy + py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Draw Centered Micro-Silhouette using Path2D
      const path = getPath2D(uType);
      if (path) {
        ctx.save();
        // Translate to token center and scale 48x48 viewport down to fit inside (~24-26px wide)
        const targetSize = isVehicle ? 27 : 24;
        const scale = targetSize / 48;
        ctx.translate(cx - (24 * scale), cy - (24 * scale));
        ctx.scale(scale, scale);

        // Fill silhouette with team light highlight
        ctx.fillStyle = teamLight;
        ctx.fill(path);

        // Subtle ink contour for maximum definition
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#05070f';
        ctx.stroke(path);

        ctx.restore();
      }

      // 6. Perimeter Health Arc Ring
      const hpPct = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
      if (hpPct < 1.0) {
        ctx.beginPath();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * hpPct);
        const arcRadius = radius + 2.5;

        // Background track
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, arcRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Active health arc
        ctx.beginPath();
        ctx.arc(cx, cy, arcRadius, startAngle, endAngle);
        ctx.strokeStyle = hpPct > 0.5 ? '#22c55e' : (hpPct > 0.25 ? '#eab308' : '#ef4444');
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 7. Stance Indicator Pip (Bottom Center)
      if (unit.stance) {
        let stanceColor = '#3b82f6';
        let stanceSymbol = '▲';
        if (unit.stance === 'DEFEND') {
          stanceColor = '#10b981';
          stanceSymbol = '■';
        } else if (unit.stance === 'AMBUSH') {
          stanceColor = '#a855f7';
          stanceSymbol = '✦';
        }

        ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy + radius - 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = stanceColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = stanceColor;
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stanceSymbol, cx, cy + radius - 2);
      }

      // 8. Stealth / Ambush camouflage dashed ring
      if (unit.stance === 'AMBUSH' && unit.isAmbusherHidden && isP1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    },

    /**
     * Scan the DOM and populate any element with [data-unit-badge]
     */
    renderStaticBadges(container = (typeof document !== 'undefined' ? document : null)) {
      if (!container || !container.querySelectorAll) return;
      container.querySelectorAll('[data-unit-badge]').forEach(el => {
        const typeKey = el.getAttribute('data-unit-badge');
        const size = el.getAttribute('data-badge-size') || 'sm';
        const owner = parseInt(el.getAttribute('data-badge-owner') || '0', 10);
        const extraClass = el.getAttribute('data-badge-class') || '';
        el.innerHTML = this.getBadgeHtml(typeKey, { size, owner, class: extraClass });
      });
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => UnitIcons.renderStaticBadges());
    } else {
      setTimeout(() => UnitIcons.renderStaticBadges(), 0);
    }
  }

  // Expose globally for both browser and Node environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnitIcons;
  }
  global.UnitIcons = UnitIcons;

})(typeof window !== 'undefined' ? window : global);
