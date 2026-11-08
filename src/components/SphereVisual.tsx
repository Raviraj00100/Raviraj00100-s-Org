import React, { useEffect, useRef } from 'react';

interface SphereVisualProps {
  className?: string;
}

export const SphereVisual: React.FC<SphereVisualProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate 3D sphere points
    const POINT_COUNT = 96;
    const points: Array<{ x: number; y: number; z: number; baseAngle: number; speed: number; radius: number; color: string }> = [];
    const colors = ['#8B5CF6', '#6366F1', '#38BDF8', '#C084FC', '#A855F7', '#E0E7FF'];

    for (let i = 0; i < POINT_COUNT; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = 110 + Math.random() * 25;
      points.push({
        x: r * Math.sin(theta) * Math.cos(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(theta),
        baseAngle: phi,
        speed: 0.003 + Math.random() * 0.004,
        radius: 1.5 + Math.random() * 2.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let rotX = 0.2;
    let rotY = 0;
    let targetRotX = 0.2;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 0.8;
      targetRotX = -ny * 0.6;
    };

    window.addEventListener('mousemove', handlePointerMove);

    let tick = 0;
    const render = () => {
      tick++;
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05 + 0.003;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw subtle ambient radial glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180);
      bgGrad.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
      bgGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.1)');
      bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fill();

      // Draw orbital rings
      const rings = [130, 95, 60];
      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.38, rotY * (idx % 2 === 0 ? 1 : -1) + idx, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 0 ? 'rgba(139, 92, 246, 0.25)' : 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Project and sort points
      const projected = points.map(p => {
        // Rotate around Y
        const cosY = Math.cos(rotY + p.speed * tick);
        const sinY = Math.sin(rotY + p.speed * tick);
        let x1 = p.x * cosY + p.z * sinY;
        let z1 = -p.x * sinY + p.z * cosY;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Perspective
        const fov = 320;
        const scale = fov / (fov + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return {
          px,
          py,
          scale,
          z: z2,
          radius: p.radius * scale,
          color: p.color
        };
      });

      // Sort by depth
      projected.sort((a, b) => b.z - a.z);

      // Draw connecting filaments for close points
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 46) {
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            const alpha = Math.max(0, (1 - dist / 46) * 0.22 * ((p1.scale + p2.scale) / 2));
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw points
      projected.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(0.6, p.radius), 0, Math.PI * 2);
        const alpha = Math.min(1, Math.max(0.2, (p.z + 140) / 280));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw center glowing core node
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.7)');
      coreGrad.addColorStop(0.7, 'rgba(99, 102, 241, 0.3)');
      coreGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
