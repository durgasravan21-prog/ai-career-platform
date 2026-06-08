"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  isAmbient?: boolean;
}

export function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Branding colors: cyan, purple, pink
    const colors = [
      "rgba(6, 182, 212, ",  // Cyan
      "rgba(139, 92, 246, ", // Purple
      "rgba(236, 72, 153, ", // Pink
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Spawns a mouse-trail particle
    const spawnTrailParticle = (x: number, y: number) => {
      const size = Math.random() * 4 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        // Floating up (Antigravity flow)
        vy: -Math.random() * 1.2 - 0.3,
        size,
        color,
        alpha: 0.85,
        decay: Math.random() * 0.015 + 0.01,
      });
    };

    // Spawns slow ambient floating particles in the background (Antigravity drift)
    const spawnAmbientParticles = () => {
      if (particles.filter(p => p.isAmbient).length < 40) {
        const x = Math.random() * canvas.width;
        const y = canvas.height + 20;
        const size = Math.random() * 3 + 1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.5 - 0.2, // slowly rises
          size,
          color,
          alpha: Math.random() * 0.4 + 0.1,
          decay: Math.random() * 0.003 + 0.001,
          isAmbient: true,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;

      // Spawn trail particles on cursor move
      for (let i = 0; i < 2; i++) {
        spawnTrailParticle(e.clientX, e.clientY);
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseRef.current.x = touch.clientX;
        mouseRef.current.y = touch.clientY;
        mouseRef.current.active = true;
        spawnTrailParticle(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Canvas draw and physics loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawns ambient nodes rising from the bottom
      spawnAmbientParticles();

      const mouse = mouseRef.current;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        // Repel particles when the cursor is nearby
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const force = (120 - distance) / 120;
            p.vx += (dx / distance) * force * 0.08;
            p.vy += (dy / distance) * force * 0.08;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha.toFixed(2) + ")";
        ctx.fill();

        // radial glow for trail nodes
        if (!p.isAmbient && p.size > 3.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (p.alpha * 0.25).toFixed(2) + ")";
          ctx.fill();
        }
      });

      // Filter active nodes
      particles = particles.filter(
        (p) => p.alpha > 0 && p.y > -50 && p.x > -50 && p.x < canvas.width + 50
      );

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
