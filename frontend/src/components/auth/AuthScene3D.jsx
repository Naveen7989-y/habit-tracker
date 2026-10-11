import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeVisual } from '../../utils/themeVisuals';

/**
 * High-performance interactive 3D Canvas Background
 * Dynamically adjusts particle colors, 3D rotating gemstones,
 * and ambient volumetric nebulae according to the active theme.
 */
export default function AuthScene3D() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates & camera tilt with lerping
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    let cameraRotX = 0;
    let cameraRotY = 0;
    let targetCameraRotX = 0;
    let targetCameraRotY = 0;

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      targetCameraRotY = ((e.clientX - width / 2) / (width / 2)) * 0.35;
      targetCameraRotX = -((e.clientY - height / 2) / (height / 2)) * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // 3D Particles setup
    const PARTICLE_COUNT = Math.min(85, Math.floor((width * height) / 14000));
    const FOCAL_LENGTH = 380;
    const BOUND_X = 700;
    const BOUND_Y = 550;
    const BOUND_Z = 600;

    const particles = [];
    const colors = themeVisual.particleColors;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * BOUND_X * 2,
        y: (Math.random() - 0.5) * BOUND_Y * 2,
        z: Math.random() * BOUND_Z + 50,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.4 + 0.4,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // 3D Polyhedrons (Wireframe Habit Gems)
    const createOctahedron = (cx, cy, cz, radius, color, rotSpeed) => {
      const vertices = [
        { x: 0, y: -radius, z: 0 }, // Top
        { x: radius, y: 0, z: 0 },  // Right
        { x: 0, y: 0, z: radius },  // Front
        { x: -radius, y: 0, z: 0 }, // Left
        { x: 0, y: 0, z: -radius }, // Back
        { x: 0, y: radius, z: 0 },  // Bottom
      ];

      const edges = [
        [0, 1], [0, 2], [0, 3], [0, 4], // Top to middle
        [5, 1], [5, 2], [5, 3], [5, 4], // Bottom to middle
        [1, 2], [2, 3], [3, 4], [4, 1], // Middle ring
      ];

      return {
        center: { x: cx, y: cy, z: cz },
        baseCenter: { x: cx, y: cy, z: cz },
        radius,
        vertices,
        edges,
        color,
        rotX: Math.random() * Math.PI,
        rotY: Math.random() * Math.PI,
        rotZ: Math.random() * Math.PI,
        rotSpeed,
      };
    };

    const gems = [
      createOctahedron(BOUND_X * 0.45, -BOUND_Y * 0.35, 280, 85, themeVisual.gem1, { x: 0.008, y: 0.012, z: 0.005 }),
      createOctahedron(-BOUND_X * 0.5, BOUND_Y * 0.4, 320, 65, themeVisual.gem2, { x: -0.006, y: 0.01, z: -0.007 }),
    ];

    let time = 0;

    // Render Loop
    const render = () => {
      time += 0.015;

      cameraRotX += (targetCameraRotX - cameraRotX) * 0.05;
      cameraRotY += (targetCameraRotY - cameraRotY) * 0.05;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cosY = Math.cos(cameraRotY);
      const sinY = Math.sin(cameraRotY);
      const cosX = Math.cos(cameraRotX);
      const sinX = Math.sin(cameraRotX);

      const project = (x, y, z) => {
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const distance = FOCAL_LENGTH + z2;
        if (distance <= 10) return null;

        const scale = FOCAL_LENGTH / distance;
        return {
          sx: x1 * scale + width / 2,
          sy: y2 * scale + height / 2,
          scale,
          depth: z2,
        };
      };

      // 1. Draw 3D Polyhedrons
      gems.forEach((gem) => {
        gem.rotX += gem.rotSpeed.x;
        gem.rotY += gem.rotSpeed.y;
        gem.rotZ += gem.rotSpeed.z;

        gem.center.y = gem.baseCenter.y + Math.sin(time + gem.center.x) * 15;

        const cCosX = Math.cos(gem.rotX);
        const cSinX = Math.sin(gem.rotX);
        const cCosY = Math.cos(gem.rotY);
        const cSinY = Math.sin(gem.rotY);
        const cCosZ = Math.cos(gem.rotZ);
        const cSinZ = Math.sin(gem.rotZ);

        const projectedVerts = gem.vertices.map((v) => {
          let vx = v.x;
          let vy = v.y;
          let vz = v.z;

          const y1 = vy * cCosX - vz * cSinX;
          const z1 = vz * cCosX + vy * cSinX;
          const x2 = vx * cCosY + z1 * cSinY;
          const z2 = z1 * cCosY - vx * cSinY;
          const x3 = x2 * cCosZ - y1 * cSinZ;
          const y3 = y1 * cCosZ + x2 * cSinZ;

          const wx = x3 + gem.center.x;
          const wy = y3 + gem.center.y;
          const wz = z2 + gem.center.z;

          return project(wx, wy, wz);
        });

        // Edges
        ctx.save();
        gem.edges.forEach(([i, j]) => {
          const p1 = projectedVerts[i];
          const p2 = projectedVerts[j];
          if (!p1 || !p2) return;

          const edgeDepth = (p1.depth + p2.depth) / 2;
          const alpha = Math.max(0.12, Math.min(0.7, (1 - edgeDepth / (BOUND_Z * 1.5)) * 0.7));

          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.strokeStyle = `rgba(${gem.color.r}, ${gem.color.g}, ${gem.color.b}, ${alpha})`;
          ctx.lineWidth = Math.max(1, p1.scale * 2.2);
          ctx.shadowBlur = 14;
          ctx.shadowColor = `rgba(${gem.color.r}, ${gem.color.g}, ${gem.color.b}, 0.6)`;
          ctx.stroke();
        });

        // Glowing Vertices
        projectedVerts.forEach((p) => {
          if (!p) return;
          ctx.beginPath();
          const r = Math.max(1.5, p.scale * 4);
          ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
          ctx.fillStyle = themeVisual.isDark ? 'rgba(255, 255, 255, 0.95)' : `rgba(${gem.color.r}, ${gem.color.g}, ${gem.color.b}, 0.95)`;
          ctx.shadowBlur = themeVisual.isDark ? 18 : 8;
          ctx.shadowColor = `rgba(${gem.color.r}, ${gem.color.g}, ${gem.color.b}, 1)`;
          ctx.fill();
        });
        ctx.restore();
      });

      // 2. Update & Project Particles
      const projectedParticles = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.x < -BOUND_X) p.x = BOUND_X;
        if (p.x > BOUND_X) p.x = -BOUND_X;
        if (p.y < -BOUND_Y) p.y = BOUND_Y;
        if (p.y > BOUND_Y) p.y = -BOUND_Y;
        if (p.z < 40) p.z = BOUND_Z;
        if (p.z > BOUND_Z) p.z = 40;

        const proj = project(p.x, p.y, p.z);
        if (proj) {
          projectedParticles.push({ p, proj });
        }
      }

      // Proximity Connections
      ctx.save();
      const connColor = themeVisual.gem1 || { r: 6, g: 143, b: 255 };
      for (let i = 0; i < projectedParticles.length; i++) {
        const pi = projectedParticles[i];
        for (let j = i + 1; j < projectedParticles.length; j++) {
          const pj = projectedParticles[j];
          const dx = pi.p.x - pj.p.x;
          const dy = pi.p.y - pj.p.y;
          const dz = pi.p.z - pj.p.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < 125) {
            const lineAlpha = (1 - dist3D / 125) * 0.22 * Math.min(pi.proj.scale, pj.proj.scale);
            if (lineAlpha > 0.015) {
              ctx.beginPath();
              ctx.moveTo(pi.proj.sx, pi.proj.sy);
              ctx.lineTo(pj.proj.sx, pj.proj.sy);
              ctx.strokeStyle = `rgba(${connColor.r}, ${connColor.g}, ${connColor.b}, ${lineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }
      ctx.restore();

      // Draw Particles
      ctx.save();
      for (let i = 0; i < projectedParticles.length; i++) {
        const { p, proj } = projectedParticles[i];
        const pulse = Math.sin(time * 2 + p.pulseOffset) * 0.2 + 0.8;
        const alpha = Math.max(0.15, Math.min(1, p.baseAlpha * proj.scale * 1.5 * pulse));
        const r = Math.max(1, p.radius * proj.scale * 1.6);

        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.colorPrefix}0.7)`;
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [themeVisual]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-700">
      {/* Dynamic 3D HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ filter: 'contrast(105%)' }}
      />

      {/* Volumetric Glowing Nebulas / Atmospheric Orbs matching active Theme */}
      <div 
        className="absolute top-1/6 -left-32 w-[34rem] h-[34rem] rounded-full blur-[140px] pointer-events-none opacity-30 animate-pulse-subtle transition-all duration-700"
        style={{
          background: themeVisual.aurora1,
        }}
      />
      <div 
        className="absolute bottom-1/6 -right-32 w-[38rem] h-[38rem] rounded-full blur-[160px] pointer-events-none opacity-30 animate-pulse-subtle transition-all duration-700"
        style={{
          background: themeVisual.aurora2,
          animationDelay: '1.5s',
        }}
      />
      <div 
        className="absolute top-2/3 left-1/3 w-[26rem] h-[26rem] rounded-full blur-[130px] pointer-events-none opacity-20 transition-all duration-700"
        style={{
          background: themeVisual.aurora3,
        }}
      />

      {/* Subtle 3D Depth Grid Floor at Bottom */}
      <div 
        className="absolute bottom-0 inset-x-0 h-64 pointer-events-none opacity-20"
        style={{
          background: `linear-gradient(to top, ${themeVisual.accentGlowColor}, transparent)`,
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }}
      />
    </div>
  );
}
