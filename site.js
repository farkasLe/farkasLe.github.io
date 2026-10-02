(function(){
  var root = document.documentElement;

  /* Theme toggle. The stored choice is applied before first paint in <head>. */
  function current(){
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var btn = document.getElementById('themeToggle');
  function label(){ if (btn) btn.textContent = current() === 'dark' ? 'Light mode' : 'Dark mode'; }
  label();
  if (btn) btn.addEventListener('click', function(){
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });

  /* Field-test bars grow once, when the chart scrolls into view. */
  var lift = document.querySelector('.lift');
  if (lift) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.isIntersecting) { lift.classList.add('in'); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(lift);
    } else {
      lift.classList.add('in');
    }
  }

  /* CONE: the poster is the converged frame (25 KB); the 0.56 MB animation loads on click.
     Every swap fetches and decodes the next image off-screen first, so the current image
     stays up until the new one is ready -- swapping src directly left a blank box. */
  function ready(src, done, fail){
    var pre = new Image(), fired = false;
    function once(){ if (!fired) { fired = true; done(); } }
    pre.onload = function(){
      // decode() can wait indefinitely in a background tab; never hold the swap past 1.5 s
      if (pre.decode) { pre.decode().then(once, once); setTimeout(once, 1500); } else { once(); }
    };
    pre.onerror = fail;
    pre.src = src;
  }
  document.querySelectorAll('.cone-play').forEach(function(b){
    var img = b.querySelector('img'), badge = b.querySelector('.cone-badge');
    var PLAY = '▶ Play the 700 runs', STOP = '■ Stop';
    var busy = false;
    function set(src, playing){
      busy = false;
      img.src = src;
      b.setAttribute('aria-pressed', playing ? 'true' : 'false');
      badge.textContent = playing ? STOP : PLAY;
    }
    b.addEventListener('click', function(){
      if (busy) return;
      busy = true;
      var playing = b.getAttribute('aria-pressed') === 'true';
      var next = playing ? b.dataset.poster : b.dataset.anim;
      if (!playing) badge.textContent = 'Loading…';
      ready(next, function(){ set(next, !playing); },
                  function(){ busy = false; badge.textContent = playing ? STOP : PLAY; });
    });
  });
})();
