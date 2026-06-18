(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var overlay = document.getElementById("overlay");
  var overlayText = document.getElementById("overlayText");
  var startButton = document.getElementById("startButton");
  var jumpButton = document.getElementById("jumpButton");
  var duckButton = document.getElementById("duckButton");

  var W = canvas.width;
  var H = canvas.height;
  var groundY = 284;
  var gravity = 2350;
  var jumpVelocity = -820;
  var jumpHoldForce = -1450;
  var maxJumpHold = 0.18;
  var fastDropGravity = 3900;
  var bestScore = Number(localStorage.getItem("zhang-runner-best") || 0);
  var lastTime = 0;
  var spawnTimer = 0;
  var state = "ready";
  var input = { jumpHeld: false, duckHeld: false };

  var bgm = new Audio("assets/bgm.m4a");
  bgm.loop = true;
  bgm.volume = 0.5;
  var deathSound = new Audio("assets/death.mp3");
  deathSound.volume = 0.9;

  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  var assets = {
    runner: "assets/generated/zhang-runner.png",
    duck: "assets/generated/zhang-duck.png",
    qiaolezi: "assets/generated/qiaolezi.png",
    qiaoleziAlt: "assets/generated/qiaolezi-alt.png",
    spriteBottle: "assets/generated/sprite-bottle.png"
  };

  var images = {};
  var loadedCount = 0;
  var assetKeys = Object.keys(assets);

  var player = {
    x: 106, y: groundY - 132, standW: 98, standH: 132,
    duckW: 104, duckH: 91, w: 98, h: 132,
    vy: 0, grounded: true, ducking: false, jumpHold: 0,
    invincible: 0, combo: 0, maxCombo: 0
  };

  var game = {
    speed: 410, distance: 0, score: 0,
    obstacles: [], dust: [], quotes: [], powerups: [],
    achievements: [], comboFlash: 0, shakeAmount: 0,
    lastMilestoneScore: 0
  };

  // ═══════════ 地图系统 ═══════════
  var MAPS = {
    campus:  { label: "🎓 校园跑道", sky: "#f7fbff", cloud: "#e8f3ec", belt: "#3f4d44", deck: "#dde7e1", accent: "#1f6f4a" },
    city:    { label: "🌃 城市夜景", sky: "#1a1a2e", cloud: "#252540", belt: "#3a3050", deck: "#2a2030", accent: "#ffd700" },
    snow:    { label: "🏔️ 雪山高原", sky: "#e8f0ff", cloud: "#ffffff", belt: "#607080", deck: "#dce4f0", accent: "#4a90d9" },
    volcano: { label: "🌋 火山地狱", sky: "#2a1010", cloud: "#4a2020", belt: "#5a2828", deck: "#341818", accent: "#ff4500" },
    cyber:   { label: "🌆 赛博都市", sky: "#08081a", cloud: "#1a1040", belt: "#302050", deck: "#181030", accent: "#ff3ac0" },
    beach:   { label: "🏖️ 沙滩海岸", sky: "#fff8e8", cloud: "#fff4dc", belt: "#c8a860", deck: "#f0e0c0", accent: "#00aaaa" }
  };
  var selectedMap = "campus";
  var mapData = MAPS[selectedMap];

  // ═══════════ 张雪峰经典语录库 ═══════════
  var QUOTES = {
    gameplay: [
      "你一定能考上！",
      "学习是你这辈子最简单的事！",
      "往死里学就完了！",
      "机会在你手里，不在我嘴里！",
      "你跑不过我你信吗？",
      "咱们就练起来！",
      "一切皆有可能！",
      "用泥巴种荷花！",
      "别给我树道德牌坊！",
      "读书的苦是最容易吃的！",
      "高考最后一个月，往死里干！",
      "鱼找鱼，虾找虾，乌龟配王八！",
      "我最起码干到女儿高考完！",
      "我什么时候凉过？",
      "穷不读书，穷根难断！",
      "富不读书，富不长久！",
      "三代人中总有一代要拼命！",
      "规则从来都是强者制定的！",
      "用几年的努力换几十年的安稳！",
      "选择大于努力！",
      "回归真题，回归基础！",
      "我高考不是第一名，但同学聚会我坐最中间！",
      "没本事的男人才会说女人现实！",
      "学历是敲门砖，没有这块砖你连门都进不去！",
      "社会就是一个大筛子！"
    ],
    death: [
      "你跑不过我你信吗？！",
      "44岁跑步机猝死跟我没关系！",
      "我还活着呢，把我供起来干啥！",
      "有的学生考前拜我，以为我死了呢！",
      "房贷要还30年，我TM还能活30年吗？",
      "明年高考到处是我的白底肖像照！",
      "人这一生一定会死的！",
      "你脑子进水了吧？",
      "你这是从一个大坑跳到小坑啊！",
      "狗死了是它的命！"
    ],
    milestone: [
      { score: 100, text: "考研上岸！", emoji: "🎓" },
      { score: 300, text: "985在向你招手！", emoji: "🏫" },
      { score: 500, text: "开始财富自由之路！", emoji: "💎" },
      { score: 800, text: "你就是人上人！", emoji: "👑" },
      { score: 1200, text: "同学聚会坐最中间！", emoji: "🏆" },
      { score: 2000, text: "封神了！雪峰都得叫你老师！", emoji: "🌟" }
    ],
    powerup: [
      "无敌是多么寂寞！",
      "开了挂的人生不需要解释！",
      "这就是学历的力量！",
      "985免死金牌！"
    ]
  };

  // ═══════════ Web Speech API ═══════════
  var speechSynth = window.speechSynthesis;
  var lastSpeechTime = 0;
  var SPEECH_COOLDOWN = 6000;

  function speakQuote(text) {
    if (!speechSynth) return;
    var now = Date.now();
    if (now - lastSpeechTime < SPEECH_COOLDOWN) return;
    lastSpeechTime = now;
    try {
      var utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.rate = 1.1;
      utter.pitch = 0.9;
      utter.volume = 0.55;
      speechSynth.cancel();
      speechSynth.speak(utter);
    } catch (e) {}
  }

  function playPowerupSound() {
    try {
      var c = getAudioCtx();
      var o = c.createOscillator();
      var g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "sine"; g.gain.value = 0.1;
      o.frequency.setValueAtTime(660, c.currentTime);
      o.frequency.linearRampToValueAtTime(880, c.currentTime + 0.08);
      o.frequency.linearRampToValueAtTime(1100, c.currentTime + 0.16);
      g.gain.linearRampToValueAtTime(0, c.currentTime + 0.25);
      o.start(c.currentTime); o.stop(c.currentTime + 0.25);
    } catch (e) {}
  }

  function playComboSound(combo) {
    try {
      var c = getAudioCtx();
      var o = c.createOscillator();
      var g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "triangle"; g.gain.value = 0.06;
      var f = 440 + combo * 12;
      o.frequency.setValueAtTime(f, c.currentTime);
      g.gain.linearRampToValueAtTime(0, c.currentTime + 0.12);
      o.start(c.currentTime); o.stop(c.currentTime + 0.12);
    } catch (e) {}
  }

  // ═══════════ LOADING ═══════════
  function loadAssets() {
    assetKeys.forEach(function (key) {
      var img = new Image();
      img.onload = function () {
        loadedCount += 1;
        if (loadedCount === assetKeys.length) {
          configurePlayerSprites();
          updatePlayerShape();
          drawFrame(0);
        }
      };
      img.src = assets[key];
      images[key] = img;
    });
  }

  function configurePlayerSprites() {
    player.standH = 132;
    player.standW = Math.round(player.standH * images.runner.naturalWidth / images.runner.naturalHeight);
    player.duckH = 91;
    player.duckW = Math.round(player.duckH * images.duck.naturalWidth / images.duck.naturalHeight);
  }

  // ═══════════ RESET ═══════════
  function resetGame() {
    input.jumpHeld = false;
    input.duckHeld = false;
    player.w = player.standW;
    player.h = player.standH;
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
    player.ducking = false;
    player.jumpHold = 0;
    player.invincible = 0;
    player.combo = 0;
    player.maxCombo = 0;
    game.speed = 410;
    game.distance = 0;
    game.score = 0;
    game.obstacles = [];
    game.dust = [];
    game.quotes = [];
    game.powerups = [];
    game.achievements = [];
    game.comboFlash = 0;
    game.shakeAmount = 0;
    game.lastMilestoneScore = 0;
    mapData = MAPS[selectedMap];
    spawnTimer = 0.65;
    lastTime = performance.now();
    lastSpeechTime = 0;
    danmakuLaneBusy = [0, 0, 0, 0, 0];
  }

  function startGame() {
    if (loadedCount !== assetKeys.length) {
      overlayText.textContent = "素材还在加载，马上就能跑。";
      return;
    }
    playBgm();
    resetGame();
    state = "playing";
    overlay.classList.add("hidden");
    requestAnimationFrame(loop);
  }

  function playBgm() {
    if (!bgm.paused) return;
    bgm.play().catch(function () {});
  }

  function jump() {
    if (state === "ready" || state === "gameover") { startGame(); return; }
    if (player.grounded) {
      input.duckHeld = false;
      player.ducking = false;
      player.vy = jumpVelocity;
      player.grounded = false;
      player.jumpHold = maxJumpHold;
      makeDust(player.x + 34, groundY - 8);
    }
  }

  function setDuck(ducking) {
    input.duckHeld = ducking;
    if (state !== "playing") return;
    if (!player.grounded && ducking && player.vy < 900) player.vy += 420;
  }

  function endGame() {
    if (state === "gameover") return;
    state = "gameover";
    playDeathSound();
    var q = QUOTES.death[Math.floor(Math.random() * QUOTES.death.length)];
    bestScore = Math.max(bestScore, game.score);
    localStorage.setItem("zhang-runner-best", String(bestScore));
    updateScore();
    overlayText.innerHTML = "「<b>" + q + "</b>」<br><br>最高连躲: " + player.maxCombo + " 次 | 得分: " + game.score + "<br>空格 / ↑ / 点击再跑一把。";
    startButton.textContent = "重来";
    overlay.classList.remove("hidden");
    game.shakeAmount = 1.0;
  }

  function playDeathSound() {
    deathSound.currentTime = 0;
    deathSound.play().catch(function () {});
  }

  // ═══════════ FX ═══════════
  function makeDust(x, y) {
    for (var i = 0; i < 6; i += 1) {
      game.dust.push({
        x: x - Math.random() * 18, y: y + Math.random() * 10,
        r: 2 + Math.random() * 4, vx: -80 - Math.random() * 120,
        life: 0.35 + Math.random() * 0.22
      });
    }
  }

  // Danmaku lane system — prevent overlap
  var DANMAKU_LANES = [50, 82, 114, 146, 178]; // 5 horizontal lanes, evenly spaced
  var danmakuLaneBusy = [0, 0, 0, 0, 0]; // timestamp when each lane frees up

  function spawnQuote() {
    var now = performance.now() / 1000;
    // Find an available lane (not busy)
    var available = [];
    for (var i = 0; i < DANMAKU_LANES.length; i++) {
      if (now >= danmakuLaneBusy[i]) available.push(i);
    }
    if (available.length === 0) return; // all lanes occupied

    var laneIdx = available[Math.floor(Math.random() * available.length)];
    var q = QUOTES.gameplay[Math.floor(Math.random() * QUOTES.gameplay.length)];

    // Estimate text width to calculate duration
    var tempMetrics = ctx.measureText(q.text);
    var textWidth = tempMetrics.width || q.text.length * 14;
    var scrollDuration = (W + textWidth + 80) / 280; // 280px/s scroll speed

    game.quotes.push({
      text: q,
      x: W + 20,           // start off right edge
      y: DANMAKU_LANES[laneIdx],
      baseY: DANMAKU_LANES[laneIdx],
      life: scrollDuration,
      alpha: 1,
      lane: laneIdx,
      speed: 280            // px/s uniform speed
    });

    // Mark lane busy until this quote fully exits screen
    danmakuLaneBusy[laneIdx] = now + scrollDuration + 0.5; // 0.5s gap between consecutive
  }

  function spawnAchievement(text, emoji) {
    game.achievements.push({
      text: text, emoji: emoji,
      life: 2.0, alpha: 1, scale: 0.5
    });
  }

  // ═══════════ SPAWN ═══════════
  function spawnObstacle() {
    var flying = game.score > 220 && Math.random() < 0.4;
    var useAlt = Math.random() < 0.5;
    var obstacle;
    if (flying) {
      var roll = Math.random();
      var lane, sm;
      if (roll < 0.45) { lane = "duck"; sm = 1.04 + Math.random() * 0.28; }
      else if (roll < 0.78) { lane = "jump"; sm = 0.94 + Math.random() * 0.22; }
      else { lane = "high"; sm = 1.12 + Math.random() * 0.38; }
      obstacle = {
        type: "spriteBottle", img: images.spriteBottle,
        x: W + 30, y: getFlyingY(lane), w: 134, h: 76,
        hitPad: 13, lane: lane, speedMultiplier: sm
      };
    } else {
      obstacle = {
        type: useAlt ? "qiaoleziAlt" : "qiaolezi",
        img: useAlt ? images.qiaoleziAlt : images.qiaolezi,
        x: W + 30, y: groundY - (useAlt ? 112 : 118),
        w: useAlt ? 66 : 72, h: useAlt ? 134 : 144,
        hitPad: 9, speedMultiplier: 1
      };
    }
    game.obstacles.push(obstacle);
    spawnTimer = 0.85 + Math.random() * 0.75 - Math.min(game.score / 3000, 0.3);
  }

  function getFlyingY(lane) {
    if (lane === "duck") return groundY - 166 - Math.random() * 12;
    if (lane === "jump") return groundY - 96 - Math.random() * 16;
    return groundY - 222 - Math.random() * 26;
  }

  function spawnPowerup() {
    if (game.powerups.length > 0 || game.score < 50) return;
    if (Math.random() < 0.003) {
      game.powerups.push({
        type: Math.random() < 0.5 ? "star" : "multiplier",
        x: W + 40, y: groundY - 140 - Math.random() * 80,
        w: 36, h: 36, vy: 0, life: 6, alpha: 1
      });
    }
  }

  // ═══════════ UPDATE ═══════════
  function update(dt) {
    updatePlayerShape();

    if (player.invincible > 0) player.invincible -= dt;

    if (input.jumpHeld && player.jumpHold > 0 && player.vy < 0 && !input.duckHeld) {
      player.vy += jumpHoldForce * dt;
      player.jumpHold -= dt;
    } else { player.jumpHold = 0; }

    player.vy += (input.duckHeld && !player.grounded ? fastDropGravity : gravity) * dt;
    player.y += player.vy * dt;

    if (player.y >= groundY - player.h) {
      player.y = groundY - player.h;
      player.vy = 0; player.grounded = true; player.jumpHold = 0;
      updatePlayerShape();
    }

    game.speed = Math.min(800, game.speed + 7.5 * dt);
    game.distance += game.speed * dt;

    var comboBonus = 1 + Math.floor(player.combo / 5) * 0.25;
    game.score = Math.floor(game.distance / 10 * comboBonus);

    // Milestones
    QUOTES.milestone.forEach(function (m) {
      if (game.score >= m.score && game.lastMilestoneScore < m.score) {
        spawnAchievement(m.text, m.emoji);
        speakQuote(m.text);
      }
    });
    game.lastMilestoneScore = game.score;

    spawnTimer -= dt;
    if (spawnTimer <= 0) spawnObstacle();
    if (Math.random() < dt * 0.04) spawnQuote();
    spawnPowerup();

    // Move obstacles
    game.obstacles.forEach(function (o) { o.x -= game.speed * (o.speedMultiplier || 1) * dt; });
    game.obstacles = game.obstacles.filter(function (o) {
      var passed = o.x + o.w < player.x;
      if (passed && o.x + o.w > -40) {
        player.combo += 1;
        player.maxCombo = Math.max(player.maxCombo, player.combo);
        game.comboFlash = 0.4;
        if (player.combo === 10) spawnAchievement("10连躲！", "🔥");
        if (player.combo === 20) spawnAchievement("20连躲！！", "💥");
        if (player.combo % 10 === 0) playComboSound(player.combo);
      }
      return o.x + o.w > -40;
    });

    // Move powerups
    game.powerups.forEach(function (p) { p.x -= game.speed * 0.7 * dt; });
    game.powerups = game.powerups.filter(function (p) { return p.x + p.w > -40; });

    // Move danmaku quotes — scroll right to left at uniform speed
    game.quotes.forEach(function (q) {
      q.x -= q.speed * dt;
      q.life -= dt;
      // Fade out near the end
      if (q.life < 0.4) q.alpha = q.life / 0.4;
    });
    // Remove quotes that scrolled off screen or expired
    game.quotes = game.quotes.filter(function (q) { return q.life > 0 && q.x + 300 > -40; });

    // Move achievements
    game.achievements.forEach(function (a) {
      a.life -= dt; a.scale = Math.min(1, a.scale + dt * 2);
      if (a.life < 0.3) a.alpha = a.life / 0.3;
    });
    game.achievements = game.achievements.filter(function (a) { return a.life > 0; });

    // Dust
    game.dust.forEach(function (d) { d.x += d.vx * dt; d.life -= dt; });
    game.dust = game.dust.filter(function (d) { return d.life > 0; });

    if (game.comboFlash > 0) game.comboFlash -= dt;
    if (game.shakeAmount > 0) game.shakeAmount = Math.max(0, game.shakeAmount - dt * 3);

    checkCollisions();
  }

  function updatePlayerShape() {
    var wasH = player.h;
    player.ducking = input.duckHeld && player.grounded;
    player.w = player.ducking ? player.duckW : player.standW;
    player.h = player.ducking ? player.duckH : player.standH;
    if (player.grounded || player.h !== wasH) player.y = groundY - player.h;
  }

  function checkCollisions() {
    // Powerup collection
    game.powerups.forEach(function (p) {
      var cx1 = player.x + player.w / 2, cy1 = player.y + player.h / 2;
      var cx2 = p.x + p.w / 2, cy2 = p.y + p.h / 2;
      if (Math.abs(cx1 - cx2) < 50 && Math.abs(cy1 - cy2) < 50) {
        p.life = -1; playPowerupSound();
        if (p.type === "star") {
          player.invincible = 3.5;
          spawnAchievement("无敌模式！", "⭐");
        } else {
          game.distance += 350;
          spawnAchievement("积分加成！", "💎");
        }
        var pq = QUOTES.powerup[Math.floor(Math.random() * QUOTES.powerup.length)];
        game.quotes.push({ text: pq, x: player.x + 100, y: player.y - 20, life: 1.8, alpha: 1, speed: 220 });
      }
    });

    // Obstacle collision
    if (player.invincible > 0) return;
    var hit = game.obstacles.some(function (o) {
      if (collides(o)) { player.combo = 0; endGame(); return true; }
      return false;
    });
  }

  function collides(o) {
    var pb = getPlayerHitBox();
    var ob = { x: o.x + o.hitPad, y: o.y + o.hitPad, w: o.w - o.hitPad * 2, h: o.h - o.hitPad * 2 };
    return pb.x < ob.x + ob.w && pb.x + pb.w > ob.x &&
           pb.y < ob.y + ob.h && pb.y + pb.h > ob.y;
  }

  function getPlayerHitBox() {
    if (player.ducking) return { x: player.x + 10, y: player.y + 15, w: player.w - 18, h: player.h - 30 };
    return { x: player.x + 11, y: player.y + 8, w: player.w - 20, h: player.h - 12 };
  }

  // ═══════════ RENDER ═══════════
  function drawBackground() {
    var t = mapData;
    ctx.fillStyle = t.sky;
    ctx.fillRect(0, 0, W, H);

    // Map-specific background elements
    drawMapDecorations(t);

    // Clouds
    ctx.fillStyle = t.cloud;
    for (var i = 0; i < 6; i++) {
      var cx = (W - ((game.distance * 0.12 + i * 210) % (W + 160))) + 24;
      var cy = 44 + (i % 3) * 28;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 42, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, cy - 4, 24, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 34, cy + 3, 23, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawTreadmill(t);
  }

  function drawMapDecorations(t) {
    switch (selectedMap) {
      case "city":
        // Buildings silhouette
        ctx.fillStyle = "rgba(30,20,50,0.6)";
        for (var i = 0; i < 8; i++) {
          var bx = (W - ((game.distance * 0.08 + i * 140) % (W + 200))) + 30;
          var bh = 40 + (i % 4) * 25 + Math.sin(i * 1.8) * 15;
          ctx.fillRect(bx, groundY - bh, 30 + (i % 3) * 15, bh);
          // Windows
          ctx.fillStyle = "rgba(255,215,0,0.4)";
          for (var wy = groundY - bh + 6; wy < groundY - 6; wy += 10) {
            ctx.fillRect(bx + 4, wy, 6, 4);
            ctx.fillRect(bx + 16, wy, 6, 4);
          }
          ctx.fillStyle = "rgba(30,20,50,0.6)";
        }
        break;

      case "snow":
        // Mountain peaks
        ctx.fillStyle = "rgba(200,215,235,0.5)";
        for (var mi = 0; mi < 5; mi++) {
          var mx = (W - ((game.distance * 0.06 + mi * 220) % (W + 300))) + 40;
          var mh = 60 + (mi % 3) * 35;
          ctx.beginPath();
          ctx.moveTo(mx - 60, groundY);
          ctx.lineTo(mx, groundY - mh);
          ctx.lineTo(mx + 60, groundY);
          ctx.fill();
        }
        // Snow cap
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        for (var si = 0; si < 5; si++) {
          var sx = (W - ((game.distance * 0.06 + si * 220) % (W + 300))) + 40;
          var sh = 60 + (si % 3) * 35;
          ctx.beginPath();
          ctx.moveTo(sx - 20, groundY - sh + 20);
          ctx.lineTo(sx, groundY - sh);
          ctx.lineTo(sx + 20, groundY - sh + 20);
          ctx.fill();
        }
        break;

      case "volcano":
        // Volcano & lava glow
        var grad = ctx.createLinearGradient(0, groundY - 80, 0, groundY);
        grad.addColorStop(0, "rgba(255,69,0,0)");
        grad.addColorStop(1, "rgba(255,69,0,0.15)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, groundY - 80, W, 80);
        // Volcano cones
        ctx.fillStyle = "rgba(40,12,12,0.7)";
        for (var vi = 0; vi < 4; vi++) {
          var vx = (W - ((game.distance * 0.05 + vi * 260) % (W + 350))) + 50;
          var vh = 50 + (vi % 2) * 40;
          ctx.beginPath();
          ctx.moveTo(vx - 70, groundY);
          ctx.lineTo(vx, groundY - vh);
          ctx.lineTo(vx + 70, groundY);
          ctx.fill();
        }
        break;

      case "cyber":
        // Neon grid lines
        ctx.strokeStyle = "rgba(255,58,192,0.08)";
        ctx.lineWidth = 1;
        var gridOff = (game.distance * 0.3) % 40;
        for (var gx = -gridOff; gx < W; gx += 40) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, groundY); ctx.stroke();
        }
        for (var gy = 0; gy < groundY; gy += 40) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        }
        // Neon towers
        ctx.fillStyle = "rgba(58,20,80,0.5)";
        for (var ti = 0; ti < 10; ti++) {
          var tx = (W - ((game.distance * 0.1 + ti * 110) % (W + 180))) + 20;
          var th = 30 + (ti * 17) % 60;
          ctx.fillRect(tx, groundY - th, 14, th);
          ctx.fillStyle = "rgba(255,58,192,0.3)";
          ctx.fillRect(tx + 3, groundY - th + 4, 3, th - 6);
          ctx.fillStyle = "rgba(58,20,80,0.5)";
        }
        break;

      case "beach":
        // Ocean waves
        ctx.fillStyle = "rgba(0,170,170,0.12)";
        for (var wi = 0; wi < 6; wi++) {
          var wx = (W - ((game.distance * 0.07 + wi * 180) % (W + 200))) + 30;
          ctx.beginPath();
          ctx.ellipse(wx, 50 + wi * 25, 70, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Palm tree silhouettes
        ctx.fillStyle = "rgba(100,140,100,0.3)";
        for (var pi = 0; pi < 4; pi++) {
          var px = (W - ((game.distance * 0.04 + pi * 280) % (W + 350))) + 60;
          ctx.fillRect(px - 4, groundY - 60, 8, 60);
          ctx.beginPath();
          ctx.arc(px, groundY - 65, 22, 0, Math.PI); ctx.fill();
        }
        break;

      default: // campus — simple green field
        ctx.fillStyle = "rgba(31,111,74,0.06)";
        ctx.fillRect(0, groundY - 30, W, 30);
        break;
    }
  }

  function drawTreadmill(t) {
    var bt = groundY, bh = 34, dt_ = bt + bh;
    var so = (game.distance * 1.1) % 46;

    ctx.fillStyle = t.deck;
    ctx.fillRect(0, dt_ + 24, W, H - dt_ - 24);

    ctx.fillStyle = "#233129";
    roundedRect(26, bt - 6, W - 52, bh + 16, 9); ctx.fill();

    ctx.fillStyle = t.belt;
    roundedRect(42, bt + 2, W - 84, bh, 7); ctx.fill();

    ctx.save();
    ctx.beginPath();
    roundedRect(42, bt + 2, W - 84, bh, 7); ctx.clip();
    ctx.fillStyle = "#526158";
    for (var x = 42 - so; x < W - 38; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, bt + 2); ctx.lineTo(x + 16, bt + 2);
      ctx.lineTo(x - 8, bt + bh + 2); ctx.lineTo(x - 24, bt + bh + 2);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(42, bt + 5, W - 84, 5);
    ctx.restore();

    ctx.fillStyle = "#19231e";
    ctx.fillRect(0, bt - 2, W, 3);

    drawRoller(48, dt_ + 8, 22);
    drawRoller(W - 48, dt_ + 8, 22);

    ctx.fillStyle = "#8c9890";
    roundedRect(74, dt_ + 6, W - 148, 16, 5); ctx.fill();

    ctx.fillStyle = "#657067";
    ctx.fillRect(104, dt_ + 22, 18, 24);
    ctx.fillRect(W - 122, dt_ + 22, 18, 24);
  }

  function drawRoller(x, y, r) {
    ctx.fillStyle = "#151f1a";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#77847b";
    ctx.beginPath(); ctx.arc(x, y, r - 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#26332c"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r - 13, 0, Math.PI * 2); ctx.stroke();
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawPlayer() {
    var bob = player.grounded ? Math.sin(game.distance / 18) * 2 : 0;
    var img = player.ducking ? images.duck : images.runner;

    if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0) ctx.globalAlpha = 0.45;

    if (player.invincible > 0) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(player.x + player.w / 2, player.y + player.h / 2 + bob, player.w * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.drawImage(img, player.x, player.y + bob, player.w, player.h);
    ctx.globalAlpha = 1;
  }

  function drawObstacles() {
    game.obstacles.forEach(function (o) { ctx.drawImage(o.img, o.x, o.y, o.w, o.h); });
  }

  function drawPowerups() {
    game.powerups.forEach(function (p) {
      ctx.save(); ctx.globalAlpha = p.alpha;
      var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      if (p.type === "star") {
        drawStar(cx, cy, 16, 5, "#FFD700", "#FFA500");
      } else {
        ctx.fillStyle = "#FF6B35";
        ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFF"; ctx.font = "bold 14px Arial";
        ctx.textAlign = "center"; ctx.fillText("×2", cx, cy + 5);
      }
      ctx.restore();
    });
  }

  function drawStar(cx, cy, outerR, pts, fill, stroke) {
    var step = Math.PI / pts;
    ctx.beginPath();
    for (var i = 0; i < 2 * pts; i++) {
      var r = i % 2 === 0 ? outerR : outerR * 0.45;
      var a = -Math.PI / 2 + i * step;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawQuotes() {
    // Danmaku style — scrolling text with subtle shadow, no background box
    game.quotes.forEach(function (q) {
      ctx.save();
      ctx.globalAlpha = q.alpha * 0.85;
      ctx.textAlign = "left";

      // Subtle text shadow for readability
      ctx.font = "bold 14px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillText(q.text, q.x + 1, q.y + 1);

      // Main text — green color matching game theme
      ctx.fillStyle = "#1f6f4a";
      ctx.fillText(q.text, q.x, q.y);

      ctx.restore();
    });
  }

  function drawAchievements() {
    game.achievements.forEach(function (a) {
      ctx.save(); ctx.globalAlpha = a.alpha;
      ctx.translate(W / 2, 110);
      ctx.scale(a.scale, a.scale);
      ctx.font = "bold 22px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#1f6f4a";
      ctx.fillText(a.emoji + " " + a.text, 0, 0);
      ctx.restore();
    });
  }

  function drawCombo() {
    if (player.combo >= 3 && state === "playing") {
      var a = 0.65 + Math.sin(Date.now() / 180) * 0.3;
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = "bold 15px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = player.combo >= 10 ? "#FF6B35" : "#1f6f4a";
      ctx.fillText("🔥 ×" + player.combo, player.x + 10, player.y - 18);
      ctx.restore();
    }
  }

  function drawInvincibleBar() {
    if (player.invincible > 0) {
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 12px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⭐ 无敌 " + player.invincible.toFixed(1) + "s", player.x + player.w / 2, player.y - 32);
    }
  }

  function drawThemeLabel() {
    ctx.save(); ctx.globalAlpha = 0.4;
    ctx.font = "11px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#5e665d";
    ctx.fillText(mapData.label, W - 14, H - 10);
    ctx.restore();
  }

  function drawScorePopup() {
    if (game.comboFlash > 0 && player.combo >= 5) {
      ctx.save();
      ctx.globalAlpha = game.comboFlash / 0.4;
      ctx.font = "bold 18px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FF6B35";
      ctx.fillText("COMBO ×" + player.combo + "!", W / 2, 60);
      ctx.restore();
    }
  }

  function drawDust(_dt) {
    ctx.fillStyle = "rgba(93,104,91,0.35)";
    game.dust.forEach(function (d) {
      ctx.globalAlpha = Math.max(0, d.life / 0.55);
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r + (_dt || 0), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawFrame(dt) {
    var sx = 0, sy = 0;
    if (game.shakeAmount > 0) {
      sx = (Math.random() - 0.5) * 14 * game.shakeAmount;
      sy = (Math.random() - 0.5) * 10 * game.shakeAmount;
    }
    ctx.save();
    ctx.translate(sx, sy);
    drawBackground();
    drawDust(dt);
    drawPowerups();
    drawObstacles();
    drawPlayer();
    drawInvincibleBar();
    drawCombo();
    drawQuotes();
    drawAchievements();
    drawScorePopup();
    drawThemeLabel();
    ctx.restore();
    updateScore();
  }

  function updateScore() {
    scoreEl.textContent = padScore(game.score || 0);
    bestEl.textContent = "HI " + padScore(bestScore);
  }

  function padScore(v) { return String(Math.floor(v)).padStart(5, "0"); }

  // ═══════════ GAME LOOP ═══════════
  function loop(now) {
    if (state !== "playing") {
      if (state === "gameover" && game.shakeAmount > 0) {
        game.shakeAmount = Math.max(0, game.shakeAmount - 0.016);
        drawFrame(0);
        requestAnimationFrame(function () { loop(performance.now()); });
      }
      return;
    }
    var dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;
    update(dt);
    drawFrame(dt);
    if (state === "playing") requestAnimationFrame(loop);
  }

  // ═══════════ INPUT ═══════════
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault(); playBgm(); input.jumpHeld = true; jump();
    } else if (e.code === "ArrowDown") {
      e.preventDefault(); playBgm(); setDuck(true);
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault(); input.jumpHeld = false; player.jumpHold = 0;
    } else if (e.code === "ArrowDown") {
      e.preventDefault(); setDuck(false);
    }
  });

  canvas.addEventListener("pointerdown", function () { playBgm(); input.jumpHeld = true; jump(); });
  canvas.addEventListener("pointerup", function () { input.jumpHeld = false; player.jumpHold = 0; });
  canvas.addEventListener("pointercancel", function () { input.jumpHeld = false; player.jumpHold = 0; });

  jumpButton.addEventListener("pointerdown", function (e) { e.preventDefault(); playBgm(); input.jumpHeld = true; jump(); });
  jumpButton.addEventListener("pointerup", function (e) { e.preventDefault(); input.jumpHeld = false; player.jumpHold = 0; });
  jumpButton.addEventListener("pointerleave", function (e) { e.preventDefault(); input.jumpHeld = false; player.jumpHold = 0; });
  jumpButton.addEventListener("pointercancel", function (e) { e.preventDefault(); input.jumpHeld = false; player.jumpHold = 0; });
  duckButton.addEventListener("pointerdown", function (e) { e.preventDefault(); playBgm(); setDuck(true); });
  duckButton.addEventListener("pointerup", function (e) { e.preventDefault(); setDuck(false); });
  duckButton.addEventListener("pointerleave", function (e) { e.preventDefault(); setDuck(false); });
  duckButton.addEventListener("pointercancel", function (e) { e.preventDefault(); setDuck(false); });

  // Map selection
  document.querySelectorAll(".map-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".map-card").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      selectedMap = btn.dataset.map;
      mapData = MAPS[selectedMap];
    });
  });

  startButton.addEventListener("click", function () { playBgm(); startGame(); });

  // roundRect polyfill
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };
  }

  updateScore();
  loadAssets();
}());
