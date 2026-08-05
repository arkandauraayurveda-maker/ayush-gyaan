"use client";

import { useEffect, useRef } from "react";

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Create Star Particles
    const STAR_COUNT = Math.min(Math.floor((width * height) / 3500), 220);
    const stars: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      baseAlpha: number;
      twinkleSpeed: number;
      color: string;
    }> = [];

    const colors = [
      "rgba(255, 255, 255, ",
      "rgba(16, 185, 129, ", // Emerald glow
      "rgba(20, 184, 166, ", // Teal glow
      "rgba(99, 102, 241, ", // Indigo star
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        size: Math.random() * 1.8 + 0.5,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angle += 0.0005;

      const cx = width / 2;
      const cy = height / 2;

      // Draw faint galaxy radial nebula glow
      const nebulaGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.6);
      nebulaGrad.addColorStop(0, "rgba(5, 46, 32, 0.25)");
      nebulaGrad.addColorStop(0.5, "rgba(2, 44, 34, 0.12)");
      nebulaGrad.addColorStop(1, "rgba(2, 6, 4, 0)");
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Render 3D depth stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Slight rotation around center
        const cosA = Math.cos(0.0003);
        const sinA = Math.sin(0.0003);
        const nx = star.x * cosA - star.y * sinA;
        const ny = star.x * sinA + star.y * cosA;
        star.x = nx;
        star.y = ny;

        // Twinkle factor
        const alpha =
          star.baseAlpha + Math.sin(Date.now() * star.twinkleSpeed) * 0.25;
        const clampedAlpha = Math.max(0.1, Math.min(1, alpha));

        // Perspective projection
        const k = 400 / (star.z + 400);
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, star.size * k, 0, Math.PI * 2);
          ctx.fillStyle = `${star.color}${clampedAlpha})`;
          ctx.fill();

          // Subtle star glow for larger stars
          if (star.size > 1.4) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(16, 185, 129, 0.4)";
          } else {
            ctx.shadowBlur = 0;
          }
        }

        // Move star slightly forward
        star.z -= 0.15;
        if (star.z <= 0) {
          star.z = width;
          star.x = Math.random() * width - cx;
          star.y = Math.random() * height - cy;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 opacity-70 mix-blend-screen"
    />
  );
}
