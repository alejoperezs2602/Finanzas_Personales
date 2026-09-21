// assets/js/particles.js

export function initParticlesUI() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let particles = [];
  // Leemos el tema actual del documentElement (data-theme)
  let mode = document.documentElement.getAttribute('data-theme') === 'woman' ? 'princesa' : 'patron';
  let mouse = { x: -1000, y: -1000 };

  function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
  }
  
  window.addEventListener('resize', () => { 
    resize(); 
    initParticlesList(); 
  });
  document.addEventListener('mousemove', e => { 
    mouse.x = e.clientX; 
    mouse.y = e.clientY; 
  });
  
  resize();

  function initParticlesList() {
    const count = window.innerWidth < 768 ? 35 : 65;
    particles = [];
    for (let i = 0; i < count; i++) {
      if (mode === 'patron') {
        particles.push({
          type: 'dot',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5,
        });
      } else {
        const isCoin = Math.random() > 0.55;
        particles.push({
          type: isCoin ? 'coin' : 'petal',
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: isCoin ? Math.random() * 8 + 5 : Math.random() * 10 + 6,
          speedY: Math.random() * 0.8 + 0.2,
          speedX: (Math.random() - 0.4) * 0.5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.015 + 0.005,
          opacity: isCoin ? 0.5 + Math.random() * 0.4 : 0.25 + Math.random() * 0.35,
          hue: isCoin ? 38 + Math.random() * 15 : 340 + Math.random() * 20,
          sat: isCoin ? 70 + Math.random() * 20 : 50 + Math.random() * 20,
          light: isCoin ? 55 + Math.random() * 15 : 78 + Math.random() * 12,
        });
      }
    }
  }

  function drawPatron() {
    particles.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
      if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)'; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
      const dx = particles[i].x - mouse.x, dy = particles[i].y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 160)})`;
        ctx.lineWidth = 0.7; ctx.stroke();
      }
    }
  }

  function drawPrincesa() {
    particles.forEach(p => {
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * 0.4;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;
      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      if (p.type === 'coin') {
        const w = p.size;
        const h = p.size * 0.65;
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 1)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 0.5)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = p.opacity * 0.4;
        ctx.fillStyle = `hsla(${p.hue}, 30%, 90%, 1)`;
        ctx.beginPath();
        ctx.ellipse(-w * 0.2, -h * 0.2, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 1)`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size * 0.3, -p.size * 0.5, p.size, -p.size * 0.3, p.size * 0.5, 0);
        ctx.bezierCurveTo(p.size, p.size * 0.3, p.size * 0.3, p.size * 0.5, 0, 0);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  initParticlesList();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 'patron') drawPatron();
    else drawPrincesa();
    requestAnimationFrame(animate);
  }
  animate();

  // Exportar función para cambiar el tema de las partículas dinámicamente
  window.switchParticlesMode = function(newTheme) {
    mode = newTheme === 'woman' ? 'princesa' : 'patron';
    
    // Transición suave si GSAP está disponible
    if (window.gsap) {
      gsap.to(canvas, { opacity: 0, duration: 0.4, onComplete: () => {
        initParticlesList();
        gsap.to(canvas, { opacity: 1, duration: 0.8 });
      }});
    } else {
      initParticlesList();
    }
  };
}
