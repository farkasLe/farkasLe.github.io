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

  /* CONE: the poster is the converged frame (23 KB); the 0.65 MB animation loads on click. */
  document.querySelectorAll('.cone-play').forEach(function(b){
    var img = b.querySelector('img'), badge = b.querySelector('.cone-badge');
    b.addEventListener('click', function(){
      var on = b.getAttribute('aria-pressed') === 'true';
      img.src = on ? b.dataset.poster : b.dataset.anim;
      b.setAttribute('aria-pressed', on ? 'false' : 'true');
      badge.textContent = on ? '▶ Play the 700 runs' : '■ Stop';
    });
  });
})();
