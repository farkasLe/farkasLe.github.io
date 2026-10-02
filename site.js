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
     It is fetched and decoded off-screen first, so the poster stays up until the first
     frame is ready -- swapping src straight away left a blank box while it downloaded. */
  document.querySelectorAll('.cone-play').forEach(function(b){
    var img = b.querySelector('img'), badge = b.querySelector('.cone-badge');
    var PLAY = '▶ Play the 700 runs', STOP = '■ Stop';
    var loading = false;
    b.addEventListener('click', function(){
      if (loading) return;
      if (b.getAttribute('aria-pressed') === 'true') {
        img.src = b.dataset.poster;
        b.setAttribute('aria-pressed', 'false');
        badge.textContent = PLAY;
        return;
      }
      loading = true;
      badge.textContent = 'Loading…';
      var pre = new Image();
      function show(){
        loading = false;
        img.src = b.dataset.anim;
        b.setAttribute('aria-pressed', 'true');
        badge.textContent = STOP;
      }
      pre.onload = function(){ pre.decode ? pre.decode().then(show, show) : show(); };
      pre.onerror = function(){ loading = false; badge.textContent = PLAY; };
      pre.src = b.dataset.anim;
    });
  });
})();
