'use strict';
/**
 * FateWeave background music — generated in-browser with WebAudio.
 * A soft, slow A-minor pad (Am → F → Em) with an occasional gentle
 * chime. No audio file, no licence, no download.
 *
 * NEVER autoplays: audio only starts after the user taps the
 * ♪ Music toggle (browsers block sound before a user gesture).
 * Toggle state is remembered in localStorage ('fateweave_music').
 * If the toggle was left ON, the music starts on the user's first
 * tap/keypress on the page instead of on load.
 */
(function () {
  var btn = document.getElementById('music-toggle');
  if (!btn) return;
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) { btn.style.display = 'none'; return; }

  var KEY = 'fateweave_music';
  var ctx = null, master = null, filter = null;
  var padNodes = [];      // { osc, gain } for the current chord
  var chimeTimer = null, chordTimer = null, chordIndex = 0;
  var playing = false, started = false;

  // Chords: [name, frequencies in Hz] — slow, calm, A-minor centre.
  var CHORDS = [
    [110.00, 164.81, 220.00, 261.63, 329.63], // Am
    [87.31, 130.81, 174.61, 220.00, 261.63],  // F
    [82.41, 123.47, 164.81, 196.00, 246.94],  // Em
  ];
  var CHIMES = [659.25, 880.00, 783.99, 1046.50]; // E5, A5, G5, C6

  function ensureCtx() {
    if (ctx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);
    master.connect(ctx.destination);
  }

  function startChord(freqs, fadeIn) {
    var now = ctx.currentTime;
    var nodes = freqs.map(function (f, i) {
      var osc = ctx.createOscillator();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      osc.detune.value = (i % 2 ? 3 : -3);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.16, now + (fadeIn || 4));
      osc.connect(g); g.connect(filter);
      osc.start();
      return { osc: osc, gain: g };
    });
    return nodes;
  }

  function stopChord(nodes) {
    if (!ctx) return;
    var now = ctx.currentTime;
    nodes.forEach(function (n) {
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setValueAtTime(n.gain.gain.value, now);
      n.gain.gain.linearRampToValueAtTime(0, now + 4);
      n.osc.stop(now + 4.5);
    });
  }

  function nextChord() {
    var old = padNodes;
    chordIndex = (chordIndex + 1) % CHORDS.length;
    padNodes = startChord(CHORDS[chordIndex], 4);
    stopChord(old);
  }

  function chime() {
    if (!playing || !ctx) return;
    var f = CHIMES[Math.floor(Math.random() * CHIMES.length)];
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = f;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 4);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + 4.2);
    chimeTimer = setTimeout(chime, 9000 + Math.random() * 5000);
  }

  function startMusic() {
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    if (!started) {
      started = true;
      padNodes = startChord(CHORDS[0], 4);
      chordTimer = setInterval(nextChord, 16000);
      chimeTimer = setTimeout(chime, 6000);
    }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.055, ctx.currentTime, 1.5);
    playing = true;
  }

  function stopMusic() {
    if (!ctx) { playing = false; return; }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
    playing = false;
    setTimeout(function () { if (!playing && ctx && ctx.state === 'running') ctx.suspend(); }, 1200);
  }

  function setUI(on) {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.toggle('on', on);
    btn.innerHTML = on ? '&#9834; Music on' : '&#9834; Music';
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
  }

  btn.addEventListener('click', function () {
    if (playing) { stopMusic(); setUI(false); }
    else { startMusic(); setUI(true); }
  });

  // Pause while the tab is hidden; resume when the user comes back.
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !started) return;
    if (document.hidden) { if (ctx.state === 'running') ctx.suspend(); }
    else if (playing && ctx.state === 'suspended') ctx.resume();
  });

  // Remembered "on": show the toggle as on, but start only on the
  // user's first gesture on the page (autoplay with sound is blocked).
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === 'on') {
    setUI(true);
    var wake = function () {
      startMusic();
      document.removeEventListener('pointerdown', wake);
      document.removeEventListener('keydown', wake);
    };
    document.addEventListener('pointerdown', wake);
    document.addEventListener('keydown', wake);
  }
})();
