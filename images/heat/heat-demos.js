/* Heat unit mini-demos — self-contained, no CDN. Init when step becomes active.
   Replay/Reset on every demo; convection uses a closed circulation path. */
(function(){
  if (window.__heatDemos) return;
  window.__heatDemos = true;

  function $(sel, root){ return (root||document).querySelector(sel); }
  function onActiveStep(cb){
    var obs = new MutationObserver(function(){
      document.querySelectorAll('.step.active .mini-demo[data-demo]').forEach(function(el){
        if (!el._demoStarted){ el._demoStarted = true; cb(el); }
      });
    });
    obs.observe(document.body, {subtree:true, attributes:true, attributeFilter:['class']});
    document.querySelectorAll('.step.active .mini-demo[data-demo]').forEach(function(el){
      if (!el._demoStarted){ el._demoStarted = true; cb(el); }
    });
  }

  function setupCanvas(el){
    var cv = el.querySelector('canvas');
    if (!cv) return null;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cv.clientWidth || cv.width || 640;
    var h = Math.round(w * (cv.height/cv.width));
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
    return {cv:cv, ctx:ctx, w:w, h:h};
  }

  /** Ensure a Replay control; onReplay resets demo state and restarts motion. */
  function addReplay(el, onReplay){
    var box = el.querySelector('.demo-controls');
    if (!box){
      box = document.createElement('div');
      box.className = 'demo-controls';
      el.appendChild(box);
    }
    var existing = box.querySelector('[data-demo-replay]');
    if (existing){
      existing.onclick = function(){ onReplay(); };
      return existing;
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-secondary';
    btn.setAttribute('data-demo-replay', '1');
    btn.textContent = '↺ Replay';
    btn.setAttribute('aria-label', 'Replay animation');
    btn.addEventListener('click', function(){ onReplay(); });
    box.appendChild(btn);
    return btn;
  }

  var demos = {};

  demos.thermoCal = function(el){
    var g = setupCanvas(el); if(!g) return;
    var sl = el.querySelector('[data-param=t]');
    var lab = el.querySelector('[data-readout]');
    function draw(){
      var T = sl ? +sl.value : 50;
      if (lab) lab.textContent = T.toFixed(0) + ' °C';
      var ctx=g.ctx, W=g.w, H=g.h;
      ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
      var x=W*0.45, top=30, bot=H-30, h=bot-top;
      ctx.strokeStyle='#0a2a66'; ctx.lineWidth=2;
      ctx.strokeRect(x-10, top, 20, h);
      var frac = Math.max(0, Math.min(1, T/100));
      var y = bot - frac*h;
      ctx.fillStyle='#ef4444';
      ctx.beginPath(); ctx.arc(x, bot+8, 16, 0, Math.PI*2); ctx.fill();
      ctx.fillRect(x-8, y, 16, bot-y+8);
      ctx.fillStyle='#0a2a66'; ctx.font='12px sans-serif';
      ctx.fillText('100 °C', x+30, top+4);
      ctx.fillText('0 °C', x+30, bot);
      ctx.fillText('ice point', x+30, bot+14);
      ctx.fillText('steam point', x+30, top+18);
      ctx.fillStyle='#93c5fd'; ctx.fillRect(20, bot-40, 50, 30);
      ctx.fillStyle='#e2e8f0'; ctx.fillRect(20, top, 50, 30);
      ctx.fillStyle='#5b6170'; ctx.font='11px sans-serif';
      ctx.fillText('melting ice', 20, bot-5);
      ctx.fillText('steam', 20, top+45);
    }
    if (sl) sl.addEventListener('input', draw);
    addReplay(el, function(){ if(sl){ sl.value = 50; } draw(); });
    draw();
  };

  demos.particleTemp = function(el){
    var g = setupCanvas(el); if(!g) return;
    var sl = el.querySelector('[data-param=t]');
    var particles=[], running=true;
    function reset(){
      particles=[];
      var n=36, T=sl?+sl.value:20;
      // Relative speeds scale with sqrt-ish of T for visual: higher T → higher average KE
      var s=0.6+T/25;
      for(var i=0;i<n;i++){
        var ang=Math.random()*Math.PI*2, sp=s*(0.5+Math.random());
        particles.push({x:Math.random()*g.w, y:40+Math.random()*(g.h-50),
          vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp});
      }
      var ro=el.querySelector('[data-readout]'); if(ro) ro.textContent=(sl?+sl.value:20)+' °C (relative KE)';
    }
    function frame(){
      if(!running || !el.closest('.step.active')){ requestAnimationFrame(frame); return; }
      var T=sl?+sl.value:20, speed=0.6+T/25;
      var ctx=g.ctx; ctx.clearRect(0,0,g.w,g.h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,g.w,g.h);
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif';
      ctx.fillText('Temperature → average molecular KE', 12, 20);
      particles.forEach(function(p){
        p.x+=p.vx*speed; p.y+=p.vy*speed;
        if(p.x<8||p.x>g.w-8) p.vx*=-1;
        if(p.y<40||p.y>g.h-8) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2);
        ctx.fillStyle = T>50 ? '#ef4444' : T>25 ? '#e3780c' : '#1865f2';
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    if(sl){ sl.addEventListener('input', function(){ var T=+sl.value; var s=0.8+T/20;
      particles.forEach(function(p){ var m=Math.hypot(p.vx,p.vy)||1; p.vx=p.vx/m*s*(0.7+Math.random()*0.6); p.vy=p.vy/m*s*(0.7+Math.random()*0.6); });
      var ro=el.querySelector('[data-readout]'); if(ro) ro.textContent=T+' °C (relative KE)';
    }); }
    addReplay(el, reset);
    reset(); frame();
  };

  demos.conduction = function(el){
    var g = setupCanvas(el); if(!g) return;
    var n=12, ke=[], t0=performance.now(), rafId=null;
    function reset(){
      for(var i=0;i<n;i++) ke[i]=0.05;
      ke[0]=1;
      t0=performance.now();
    }
    function frame(){
      if(!el.closest('.step.active')){ rafId=requestAnimationFrame(frame); return; }
      var t=(performance.now()-t0)/1000;
      // Diffuse KE along neighbours — qualitative model of molecular collisions (solids)
      var next=ke.slice();
      for(var i=0;i<n;i++){
        var l=i>0?ke[i-1]:ke[i], r=i<n-1?ke[i+1]:ke[i];
        next[i]=ke[i]+0.04*(l+r-2*ke[i]);
      }
      next[0]=Math.max(next[0], 0.85+0.15*Math.sin(t*3)); // hot end driven
      ke=next;
      var ctx=g.ctx; ctx.clearRect(0,0,g.w,g.h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,g.w,g.h);
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif'; ctx.fillText('Energy handoff along a rod (hot → cool)',12,18);
      var gap=g.w/(n+1);
      for(var i=0;i<n;i++){
        var x=gap*(i+1), y=g.h/2, r=10+ke[i]*8;
        var c=Math.floor(255*Math.min(1,ke[i]));
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle='rgb(255,'+(180-c*0.5)+','+(180-c)+')'; ctx.fill();
        ctx.beginPath(); ctx.arc(x+Math.sin(t*20+i)*ke[i]*3, y+Math.cos(t*18+i)*ke[i]*3, 3,0,Math.PI*2);
        ctx.fillStyle='#0a2a66'; ctx.fill();
      }
      ctx.fillStyle='#b91c1c'; ctx.fillText('HOT', gap-10, g.h-16);
      ctx.fillStyle='#1865f2'; ctx.fillText('COOL', g.w-gap-20, g.h-16);
      rafId=requestAnimationFrame(frame);
    }
    addReplay(el, reset);
    reset(); frame();
  };

  /**
   * Convection: closed circulation.
   * Density falls when heated → buoyant rise near heater (centre bottom);
   * fluid cools near the top, sinks at the sides, returns along the bottom to the heater.
   * Previous bug: cool particles were pushed outward at the bottom and piled up as
   * static blue dots away from the heater with no way to reheat — fixed here.
   */
  demos.convection = function(el){
    var g = setupCanvas(el); if(!g) return;
    var parts=[];
    function reset(){
      parts=[];
      var cx=g.w/2;
      for(var i=0;i<28;i++){
        // Seed around both loops so the current is visible immediately
        var side = (i % 2 === 0) ? -1 : 1;
        parts.push({
          x: cx + side * (40 + Math.random()*90),
          y: 55 + Math.random()*(g.h-110),
          hot: Math.random() > 0.55
        });
      }
    }
    function frame(){
      if(!el.closest('.step.active')){ requestAnimationFrame(frame); return; }
      var ctx=g.ctx, cx=g.w/2;
      ctx.clearRect(0,0,g.w,g.h);
      ctx.fillStyle='#e0f2fe'; ctx.fillRect(40,30,g.w-80,g.h-60);
      ctx.strokeStyle='#1865f2'; ctx.strokeRect(40,30,g.w-80,g.h-60);
      // heater at bottom centre
      ctx.fillStyle='#ef4444'; ctx.fillRect(cx-40, g.h-40, 80, 14);
      ctx.fillStyle='#fff'; ctx.font='11px sans-serif'; ctx.fillText('heater', cx-18, g.h-30);

      parts.forEach(function(p){
        var nearHeater = (p.y > g.h-78) && Math.abs(p.x - cx) < 58;
        var nearTop = p.y < 58;
        if (nearHeater) p.hot = true;
        if (nearTop) p.hot = false;

        if (p.hot){
          // Warm, less dense → rise in the central column
          p.y -= 1.35;
          // In upper half, spread outward toward the sides
          if (p.y < g.h * 0.5) p.x += (p.x < cx ? -0.65 : 0.65);
          else p.x += (cx - p.x) * 0.03; // keep rising plume near centre at first
        } else {
          // Cool, denser → sink at the sides
          p.y += 1.05;
          // Near the top after cooling: keep moving outward; near the bottom: return to heater
          if (p.y > g.h * 0.55) p.x += (cx - p.x) * 0.04; // inward along floor
          else p.x += (p.x < cx ? -0.45 : 0.45);
        }

        // Soft walls — stay inside the tank
        if (p.x < 52) p.x = 52;
        if (p.x > g.w-52) p.x = g.w-52;
        if (p.y < 42) p.y = 42;
        if (p.y > g.h-48) p.y = g.h-48;

        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fillStyle = p.hot ? '#ef4444' : '#3b82f6';
        ctx.fill();
      });
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif';
      ctx.fillText('Warm fluid rises; cool fluid sinks → convection current', 50, 22);
      requestAnimationFrame(frame);
    }
    addReplay(el, reset);
    reset(); frame();
  };

  demos.radiation = function(el){
    var g = setupCanvas(el); if(!g) return;
    var t0=performance.now();
    function reset(){ t0=performance.now(); }
    function frame(){
      if(!el.closest('.step.active')){ requestAnimationFrame(frame); return; }
      var t=(performance.now()-t0)/1000;
      var ctx=g.ctx; ctx.clearRect(0,0,g.w,g.h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,g.w,g.h);
      ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(40, g.h/2, 18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#0a2a66'; ctx.font='12px sans-serif'; ctx.fillText('IR source', 15, g.h/2+35);
      ctx.fillStyle='#1e293b'; ctx.fillRect(g.w*0.35, 40, 70, 100);
      ctx.fillStyle='#fff'; ctx.fillText('black', g.w*0.35+15, 160);
      ctx.fillStyle='#e2e8f0'; ctx.strokeStyle='#64748b'; ctx.fillRect(g.w*0.65, 40, 70, 100); ctx.strokeRect(g.w*0.65, 40, 70, 100);
      ctx.fillStyle='#0a2a66'; ctx.fillText('silver', g.w*0.65+15, 160);
      for(var i=0;i<5;i++){
        var y=60+i*15, ph=(t*80+i*30)% (g.w*0.3);
        ctx.strokeStyle='#f59e0b'; ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(60+ph, y); ctx.stroke();
      }
      // Black absorbs more (good absorber); silver reflects more (poor absorber)
      var pulse = 0.5+0.5*Math.sin(t*4);
      ctx.fillStyle='rgba(239,68,68,'+pulse+')'; ctx.fillRect(g.w*0.35+10, 50, 50, 20);
      ctx.strokeStyle='#1865f2'; ctx.beginPath();
      ctx.moveTo(g.w*0.65, 70); ctx.lineTo(g.w*0.65-30, 50); ctx.stroke();
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif';
      ctx.fillText('Black absorbs more IR → heats faster', 12, 20);
      requestAnimationFrame(frame);
    }
    addReplay(el, reset);
    reset(); frame();
  };

  demos.evaporation = function(el){
    var g = setupCanvas(el); if(!g) return;
    var mols=[], cool=0;
    var slA=el.querySelector('[data-param=area]');
    function reset(){
      mols=[]; cool=0;
      for(var i=0;i<50;i++) mols.push({
        x:40+Math.random()*(g.w-80),
        y:g.h*0.55+Math.random()*(g.h*0.35),
        vx:(Math.random()-0.5)*1.5,
        vy:(Math.random()-0.5)*1.5,
        escaped:false
      });
    }
    function frame(){
      if(!el.closest('.step.active')){ requestAnimationFrame(frame); return; }
      var ctx=g.ctx; ctx.clearRect(0,0,g.w,g.h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,g.w,g.h);
      var surfaceY=g.h*0.55;
      ctx.fillStyle='#93c5fd'; ctx.fillRect(30, surfaceY, g.w-60, g.h-surfaceY-10);
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif';
      ctx.fillText('Fast molecules leave → liquid cools', 12, 20);
      if(cool>0){ ctx.fillStyle='#1865f2'; ctx.fillText('cooling…', g.w-90, 20); cool--; }
      mols.forEach(function(m){
        if(m.escaped){ m.y-=2; m.x+=m.vx; }
        else {
          m.x+=m.vx; m.y+=m.vy;
          if(m.x<40||m.x>g.w-40) m.vx*=-1;
          if(m.y>g.h-20) m.vy*=-1;
          if(m.y<surfaceY) m.vy=Math.abs(m.vy);
          var speed=Math.hypot(m.vx,m.vy);
          // Larger surface area → more chance of escape (HKDSE factor)
          var chance = 0.002 * speed * (slA? (+slA.value)/50 : 1);
          if(m.y < surfaceY+8 && speed>1.2 && Math.random()<chance){ m.escaped=true; cool=40; }
        }
        if(m.y<-10){ m.escaped=false; m.y=g.h-30; m.x=40+Math.random()*(g.w-80); m.vx=(Math.random()-0.5)*1.5; m.vy=-Math.random(); }
        ctx.beginPath(); ctx.arc(m.x,m.y,4,0,Math.PI*2);
        ctx.fillStyle=m.escaped?'#e3780c':'#1865f2'; ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    addReplay(el, reset);
    reset(); frame();
  };

  demos.boyle = function(el){
    var g = setupCanvas(el); if(!g) return;
    var sl=el.querySelector('[data-param=v]');
    var lab=el.querySelector('[data-readout]');
    var mols=[];
    function spawn(Vfrac){
      mols=[]; var n=24;
      var boxH = 40 + Vfrac * (g.h-80);
      for(var i=0;i<n;i++) mols.push({x: g.w*0.35+Math.random()*g.w*0.3, y: g.h-30-Math.random()*boxH, vx:(Math.random()-0.5)*2, vy:(Math.random()-0.5)*2});
    }
    function draw(){
      var V = sl? +sl.value/100 : 0.7;
      // Boyle's law (fixed T, fixed n): P ∝ 1/V
      if(lab) lab.textContent = 'V = ' + V.toFixed(2) + ' V₀  →  P ≈ ' + (1/V).toFixed(2) + ' P₀';
      var boxH = 40 + V * (g.h-80);
      var top = g.h-30-boxH;
      var ctx=g.ctx; ctx.clearRect(0,0,g.w,g.h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,g.w,g.h);
      ctx.strokeStyle='#0a2a66'; ctx.lineWidth=2;
      ctx.strokeRect(g.w*0.3, top, g.w*0.4, boxH+5);
      ctx.fillStyle='#94a3b8'; ctx.fillRect(g.w*0.3, top-8, g.w*0.4, 10);
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif';
      ctx.fillText('Boyle: T fixed — squeeze volume, pressure rises', 12, 20);
      var L=g.w*0.3, R=g.w*0.7, B=g.h-25;
      mols.forEach(function(m){
        m.x+=m.vx; m.y+=m.vy;
        if(m.x<L+5||m.x>R-5) m.vx*=-1;
        if(m.y<top+5||m.y>B) m.vy*=-1;
        m.y=Math.min(B, Math.max(top+5, m.y));
        ctx.beginPath(); ctx.arc(m.x,m.y,4,0,Math.PI*2); ctx.fillStyle='#1865f2'; ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    if(sl) sl.addEventListener('input', function(){ spawn(+sl.value/100); });
    addReplay(el, function(){ spawn(sl? +sl.value/100 : 0.7); });
    spawn(0.7); draw();
  };

  demos.moleculeBox = function(el){
    var g = setupCanvas(el); if(!g) return;
    var sl=el.querySelector('[data-param=t]');
    var hits=0, last=performance.now(), rate=0;
    var mols=[];
    function reset(){
      mols=[]; hits=0; last=performance.now(); rate=0;
      for(var i=0;i<30;i++) mols.push({x:50+Math.random()*(g.w-100), y:50+Math.random()*(g.h-100), vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3});
    }
    function frame(){
      if(!el.closest('.step.active')){ requestAnimationFrame(frame); return; }
      // Higher T → faster molecules → more frequent / harder wall hits → higher pressure
      var T=sl?+sl.value:300, scale=0.5+T/400;
      var ctx=g.ctx; ctx.clearRect(0,0,g.w,g.h); ctx.fillStyle='#fff'; ctx.fillRect(0,0,g.w,g.h);
      ctx.strokeStyle='#0a2a66'; ctx.lineWidth=3; ctx.strokeRect(30,40,g.w-60,g.h-70);
      ctx.fillStyle='#0a2a66'; ctx.font='13px sans-serif';
      ctx.fillText('Wall collisions → pressure  |  rate ≈ '+rate.toFixed(0)+' /s', 12, 22);
      mols.forEach(function(m){
        m.x+=m.vx*scale; m.y+=m.vy*scale;
        if(m.x<40||m.x>g.w-40){ m.vx*=-1; hits++; }
        if(m.y<50||m.y>g.h-40){ m.vy*=-1; hits++; }
        ctx.beginPath(); ctx.arc(m.x,m.y,4,0,Math.PI*2); ctx.fillStyle='#7f3f98'; ctx.fill();
      });
      var now=performance.now();
      if(now-last>500){ rate=hits*1000/(now-last); hits=0; last=now; }
      requestAnimationFrame(frame);
    }
    addReplay(el, reset);
    reset(); frame();
  };

  onActiveStep(function(el){
    var name = el.getAttribute('data-demo');
    if (demos[name]) try { demos[name](el); } catch(e){ console.warn('heat demo', name, e); }
  });
})();
