/* Research animations. Each figure plays three acts -- the problem, the method, the
   result -- and is drawn by one render(t), a pure function of time, so any moment can be
   shown directly: the act labels jump to the end of their act, and reduced motion gets
   the final frame. Colour carries the contrast: gray is the standard approach, teal is
   ours, orange is a failure. Data: anim-data.js (built by make_anim_data.py). */
(function(){
  var D = window.ANIM_DATA;
  if (!D || !document.querySelector('.anim')) return;

  var NS = 'http://www.w3.org/2000/svg';
  var ACT = [0, 4.5, 9], END = 13;

  function el(tag, attrs, parent, text){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, parent, text){
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
  function p(t, a, b){ return clamp((t - a) / (b - a)); }
  function ease(x){ return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function lerp(a, b, x){ return a + (b - a) * x; }
  function op(e, o){ e.style.opacity = o; }
  function bar(e, base, hgt){ e.setAttribute('y', base - hgt); e.setAttribute('height', Math.max(hgt, 0)); }
  function key(svg, x, y, items){                  // small legend: [[class, label], ...]
    var g = el('g', {}, svg);
    items.forEach(function(it, k){
      el('rect', {x: x, y: y - 8 + k * 15, width: 9, height: 9, 'class': it[0]}, g);
      el('text', {x: x + 14, y: y + k * 15, 'class': 'lbl'}, g, it[1]);
    });
    return g;
  }
  /* the result column: a big number for our method, what it measures, a small picture,
     and the comparison */
  function result(res, big, label, note){
    var r = {big: h('p', 'res-big', res, big), label: h('p', 'res-label', res, label)};
    r.viz = h('div', 'res-viz', res);
    r.note = h('p', 'res-note', res, note);
    return r;
  }

  /* ------------------------------------------------------------------ RI pricing */
  /* A booking menu of five bag tiers. The eye on each row shows how closely shoppers
     watch that price; in the method act each price splits into a gray base (cost +
     demand level) and a teal attention markup, which is short where the eye is dark
     and long where it is faint -- the paper's price decomposition, read row by row. */
  function ri(svg, res){
    var ATT = [100, 6.98, 4.24, 0.25, 1.25], ATT_TXT = ['100', '7', '4', '\u22480', '1'];
    var RULE = [40, 52, 64, 76, 88];                 // illustrative rule table: equal gaps
    var BASE = [22, 26, 30, 34, 38];                 // illustrative cost + demand level
    var MARK = [8, 20, 34, 50, 66];                  // illustrative attention markup
    var X0 = 124, U = 2.3, Y = [36, 76, 116, 156, 196], BH = 18;   // longest bar + label ends inside 420
    el('text', {x: 62, y: 12, 'class': 'lbl', 'text-anchor': 'middle'}, svg, 'shoppers watch');
    el('text', {x: X0, y: 12, 'class': 'lbl'}, svg, 'Price \u00b7 illustrative');
    var rows = Y.map(function(y, i){
      var r = {};
      r.g = el('g', {}, svg);
      el('text', {x: 0, y: y + 5, 'class': 'lbl mid'}, r.g, (20 + 5 * i) + ' kg');
      r.eye = el('g', {transform: 'translate(62 ' + y + ')', 'class': 'eye'}, r.g);
      el('path', {d: 'M-12 0Q0 -9 12 0Q0 9 -12 0Z'}, r.eye);
      el('circle', {r: 3.4}, r.eye);
      r.att = el('text', {x: 84, y: y + 4, 'class': 'lbl num'}, r.g, ATT_TXT[i]);
      r.rule = el('rect', {x: X0, y: y - BH / 2, height: BH, 'class': 'b-base'}, svg);
      r.base = el('rect', {x: X0, y: y - BH / 2, height: BH, 'class': 'b-data'}, svg);
      r.mark = el('rect', {y: y - BH / 2, height: BH, 'class': 'b-ours'}, svg);
      r.tick = el('line', {x1: X0 + RULE[i] * U, x2: X0 + RULE[i] * U, y1: y - BH / 2 - 4, y2: y + BH / 2 + 4, 'class': 'rule-tick'}, svg);
      var ours = BASE[i] + MARK[i];
      r.arrow = el('text', {x: X0 + Math.max(ours, RULE[i]) * U + 6, y: y + 5, 'class': 'arrow-s'}, svg,
                   ours < RULE[i] ? '\u2193 lower' : ours > RULE[i] ? '\u2191 higher' : '');
      return r;
    });
    var k1 = key(svg, X0, 230, [['b-base', 'rule table']]);
    var k2 = el('g', {}, svg);
    el('line', {x1: 330, x2: 330, y1: 2, y2: 14, 'class': 'rule-tick'}, k2);
    el('text', {x: 336, y: 12, 'class': 'lbl'}, k2, 'rule-table price');
    [['b-data', 'cost + demand level', X0], ['b-ours', 'attention markup', X0 + 136]].forEach(function(it){
      el('rect', {x: it[2], y: 222, width: 9, height: 9, 'class': it[0]}, k2);
      el('text', {x: it[2] + 14, y: 230, 'class': 'lbl'}, k2, it[1]);
    });
    var r = result(res, '+7.8%', 'baggage revenue per booking session', 'vs uniform pricing, randomized field test (p < 0.01)');
    var row = h('p', 'res-row', r.viz);
    h('span', '', row, 'Average price');
    h('b', 'res-down', row, '\u2193 lower');

    return {
      captions: [
        'Shoppers react 80\u00d7 more to the 20 kg price than to 40 kg, yet rule tables keep gaps equal.',
        'Our model adds an attention markup: small where shoppers watch closely, large where they barely look.',
        'In a randomized field test, baggage revenue rose 7.8% while the average price fell.'
      ],
      render: function(t){
        var e = ease(p(t, .4, 1.8)), b = ease(p(t, 2.2, 3.4));
        var m = ease(p(t, 5, 5.8)), k = ease(p(t, 5.8, 7.2));
        rows.forEach(function(rw, i){
          op(rw.g, p(t, 0, .4));
          op(rw.eye, lerp(.12, Math.max(.12, ATT[i] / 100), e));   // dark only where shoppers look
          op(rw.att, p(t, 1.2, 1.8));
          rw.rule.setAttribute('width', RULE[i] * U * b);
          op(rw.rule, 1 - m);
          rw.base.setAttribute('width', BASE[i] * U * m);
          rw.mark.setAttribute('x', X0 + BASE[i] * U);
          rw.mark.setAttribute('width', MARK[i] * U * k);
          op(rw.tick, m);
          op(rw.arrow, p(t, 7.2, 7.8));
        });
        op(k1, p(t, 2.2, 2.8) * (1 - m)); op(k2, m);
        var v = 7.8 * ease(p(t, 9.3, 10.6));
        r.big.textContent = '+' + v.toFixed(1) + '%';
        op(r.big, p(t, 9.1, 9.4)); op(r.label, p(t, 9.1, 9.4));
        op(r.viz, p(t, 10.8, 11.4)); op(r.note, p(t, 11.2, 11.8));
      }
    };
  }

  /* ------------------------------------------------------------------ CONE */
  function cone(svg, res){
    var c = D.cone, G = c.grid, S = 190, TOP = 26, X = [10, 220], cell = S / G, N = c.budget;
    var panels = X.map(function(x0, k){
      var g = el('g', {}, svg), d = '';
      // the close-call zone, as vertical runs of grid cells, faded as one group
      var zone = el('g', {'class': 'zone', 'shape-rendering': 'crispEdges'}, g);
      for (var i = 0; i < G; i++){
        var j = 0;
        while (j < G){
          if (c.zone[i * G + j] !== '1'){ j++; continue; }
          var j0 = j;
          while (j < G && c.zone[i * G + j] === '1') j++;
          el('rect', {x: (x0 + i * cell).toFixed(2), y: (TOP + S - j * cell).toFixed(2),
                      width: (cell + .5).toFixed(2), height: ((j - j0) * cell + .5).toFixed(2)}, zone);
        }
      }
      for (i = 0; i < G; i++) for (j = 0; j < G; j++){   // boundaries between decisions
        var here = c.best[i * G + j], yy = TOP + S - (j + 1) * cell;
        if (i + 1 < G && c.best[(i + 1) * G + j] !== here) d += 'M' + (x0 + (i + 1) * cell).toFixed(1) + ' ' + yy.toFixed(1) + 'v' + cell.toFixed(2);
        if (j + 1 < G && c.best[i * G + j + 1] !== here) d += 'M' + (x0 + i * cell).toFixed(1) + ' ' + yy.toFixed(1) + 'h' + cell.toFixed(2);
      }
      el('path', {d: d, 'class': 'bnd'}, g);
      el('rect', {x: x0, y: TOP, width: S, height: S, 'class': 'frame'}, g);
      var pts = k ? c.cone : c.unif, close = k ? c.close_cone : c.close_unif, dots = [];
      var dg = el('g', {'class': k ? 'dots ours' : 'dots'}, g);
      for (var n = 0; n < pts.length / 2; n++)
        dots.push(el('circle', {cx: (x0 + pts[2 * n] / 1000 * S).toFixed(1), cy: (TOP + S - pts[2 * n + 1] / 1000 * S).toFixed(1),
                                r: close[n] === '1' ? 2.1 : 1.6, 'class': close[n] === '1' ? 'in' : 'out', visibility: 'hidden'}, dg));
      el('text', {x: x0, y: TOP - 9, 'class': k ? 'lbl ours' : 'lbl strong'}, svg, k ? 'CONE' : 'Uniform sampling');
      var count = el('text', {x: x0 + S, y: TOP - 9, 'class': 'lbl num', 'text-anchor': 'end'}, svg);
      var stat = el('text', {x: x0, y: TOP + S + 20, 'class': k ? 'stat ours' : 'stat'}, svg);
      return {g: g, dots: dots, close: close, shown: 0, hits: 0, count: count, stat: stat};
    });
    function upto(pn, n){
      var i;
      if (n > pn.shown) for (i = pn.shown; i < n; i++){ pn.dots[i].setAttribute('visibility', 'visible'); if (pn.close[i] === '1') pn.hits++; }
      else for (i = n; i < pn.shown; i++){ pn.dots[i].setAttribute('visibility', 'hidden'); if (pn.close[i] === '1') pn.hits--; }
      pn.shown = n;
      pn.count.textContent = n + ' runs';
      pn.stat.textContent = n ? Math.round(100 * pn.hits / n) + '% of runs on close calls' : '';
    }

    var R = c.reach90, a = Math.round(R.cone / 10) * 10, b = Math.round(R.unif / 10) * 10;
    var r = result(res, '~' + a, 'runs to reach 90% correct decisions', 'Uniform sampling needs ~' + b);
    var ch = el('svg', {viewBox: '0 0 160 100', 'class': 'res-chart', 'aria-hidden': 'true'});
    r.viz.appendChild(ch);
    function cx(t){ return 4 + t / N * 152; }
    function cy(v){ return 94 - (Math.max(v, .7) - .7) / .27 * 80; }
    el('line', {x1: 4, x2: 156, y1: cy(.9), y2: cy(.9), 'class': 'ref'}, ch);
    el('text', {x: 156, y: cy(.9) + 11, 'class': 'tiny', 'text-anchor': 'end'}, ch, '90% correct');
    function line(acc, cls){
      return el('polyline', {points: c.t.map(function(t, i){ return cx(t).toFixed(1) + ',' + cy(acc[i]).toFixed(1); }).join(' '),
                             pathLength: 1, 'class': cls}, ch);
    }
    var lu = line(c.acc_unif, 'ln-u'), lc = line(c.acc_cone, 'ln-c');
    var gap = el('g', {}, ch);
    el('line', {x1: cx(R.cone), x2: cx(R.unif), y1: cy(.9) - 9, y2: cy(.9) - 9, 'class': 'gap'}, gap);
    el('text', {x: (cx(R.cone) + cx(R.unif)) / 2, y: cy(.9) - 13, 'class': 'tiny ours', 'text-anchor': 'middle'}, gap,
       Math.round(100 * (1 - R.cone / R.unif)) + '% fewer runs');
    var mu = el('circle', {cx: cx(R.unif), cy: cy(.9), r: 3.2, 'class': 'mk-u'}, ch);
    var mc = el('circle', {cx: cx(R.cone), cy: cy(.9), r: 3.2, 'class': 'mk-c'}, ch);

    return {
      captions: [
        'The best choice depends on context, and runs are costly. Uniform sampling puts few runs where the choice is close.',
        'CONE moves its runs to where the choice is close.',
        'So it reaches 90% correct decisions after about ' + a + ' runs; uniform sampling needs about ' + b + '.'
      ],
      render: function(t){
        upto(panels[0], Math.round(N * p(t, .9, 4)));
        upto(panels[1], Math.round(N * p(t, 4.9, 8.4)));
        op(panels[0].g, lerp(.2, 1, p(t, 0, .6)));
        op(panels[1].g, lerp(.2, t < ACT[1] ? .45 : 1, t < ACT[1] ? p(t, 0, .6) : 1));
        var d = p(t, 9.3, 11);
        lu.style.strokeDashoffset = 1 - d; lc.style.strokeDashoffset = 1 - d;
        op(mu, p(t, 11, 11.4)); op(mc, p(t, 11, 11.4)); op(gap, p(t, 11.4, 11.9));
        op(r.big, p(t, 11.5, 12)); op(r.label, p(t, 11.5, 12));
        op(r.viz, p(t, 9.1, 9.4)); op(r.note, p(t, 11.8, 12.3));
      }
    };
  }

  /* ------------------------------------------------------------------ staffing */
  function staff(svg, res){
    // the morning only: the surge and everything it causes happen before noon
    var s = D.staff, K = 8, M = K * 30, X0 = 34, X1 = 414, PX = (X1 - X0) / M, mu = s.mu;
    var lam = s.lam.slice(0, M / 2 + 1), NF = s.formula.slice(0, K), NC = s.cert.slice(0, K);
    var RF = s.rate_formula.slice(0, K), RC = s.rate_cert.slice(0, K);
    var UT = 26, UB = 116, LT = 164, LB = 208, LMAX = .12;
    var ymax = 1.06 * Math.max(Math.max.apply(null, lam), mu * Math.max.apply(null, NC));
    function x(m){ return X0 + m * PX; }
    function yu(v){ return UB - v / ymax * (UB - UT); }
    function hl(v){ return Math.min(v, LMAX) / LMAX * (LB - LT); }
    var fail = [];
    RF.forEach(function(v, k){ if (v > s.cap) fail.push(k); });

    var defs = el('defs', {}, svg), id = 'st' + Math.random().toString(36).slice(2, 7);
    var c1 = el('rect', {x: X0, y: 0, height: LT, width: 0}, el('clipPath', {id: id + 'a'}, defs));
    var c2 = el('rect', {x: X0, y: 0, height: LT, width: 0}, el('clipPath', {id: id + 'b'}, defs));

    var band = fail.map(function(k){
      return el('rect', {x: x(k * 30), y: UT - 6, width: 30 * PX, height: LB - UT + 6, 'class': 'warn'}, svg);
    });
    [0, 60, 120, 180, 240].forEach(function(m){
      el('text', {x: x(m), y: 228, 'class': 'lbl', 'text-anchor': 'middle'}, svg, (8 + m / 60) + ':00');
    });
    el('line', {x1: X0, x2: X1, y1: UB, y2: UB, 'class': 'axis'}, svg);
    el('line', {x1: X0, x2: X1, y1: LB, y2: LB, 'class': 'axis'}, svg);
    el('text', {x: X0, y: LT - 12, 'class': 'lbl'}, svg, 'Calls lost per half hour');
    el('line', {x1: X0, x2: X1, y1: LB - hl(s.cap), y2: LB - hl(s.cap), 'class': 'capline'}, svg);
    el('text', {x: X1, y: LB - hl(s.cap) - 4, 'class': 'lbl', 'text-anchor': 'end'}, svg, '5% cap');
    var leg = el('g', {}, svg);
    el('line', {x1: 300, x2: 316, y1: 8, y2: 8, 'class': 'ln-d'}, leg);
    el('text', {x: 320, y: 12, 'class': 'lbl'}, leg, 'calls arriving');
    var legCap = el('line', {x1: 300, x2: 316, y1: 24, y2: 24, 'class': 'cap-f'}, leg);
    el('text', {x: 320, y: 28, 'class': 'lbl'}, leg, 'staff on duty');

    function steps(N){
      return N.map(function(n, k){
        return (k ? 'V' : 'M' + X0 + ' ') + yu(mu * n).toFixed(1) + 'H' + x(k * 30 + 30).toFixed(1);
      }).join('');
    }
    var A = el('g', {'clip-path': 'url(#' + id + 'a)'}, svg), B = el('g', {'clip-path': 'url(#' + id + 'b)'}, svg);
    el('polyline', {points: lam.map(function(v, i){ return x(i * 2).toFixed(1) + ',' + yu(v).toFixed(1); }).join(' '), 'class': 'ln-d'}, A);
    var capf = el('path', {d: steps(NF), 'class': 'cap-f'}, A);
    el('path', {d: steps(NC), 'class': 'cap-c'}, B);
    var ticks = NF.map(function(n, k){
      var add = NC[k] - n;
      return el('text', {x: x(k * 30 + 15), y: 136, 'class': add ? 'tick add' : 'tick', 'text-anchor': 'middle'}, svg,
                add ? '+' + add + ' staff' : '✓');
    });
    var bars = NF.map(function(n, k){                    // calls lost, formula vs ours, side by side
      var c = x(k * 30 + 15);
      var o = {f: el('rect', {x: c - 15, width: 13, 'class': RF[k] > s.cap ? 'l-bad' : 'l-f'}, svg),
               c: el('rect', {x: c + 2, width: 13, 'class': 'l-c'}, svg)};
      if (RF[k] > s.cap){
        o.ft = el('text', {x: c - 8.5, y: LB - hl(RF[k]) - 4, 'class': 'lbl warn-t', 'text-anchor': 'middle'}, svg, Math.round(100 * RF[k]) + '%');
        o.ct = el('text', {x: c + 8.5, y: LB - hl(RC[k]) - 4, 'class': 'lbl ours', 'text-anchor': 'middle'}, svg, Math.round(100 * RC[k]) + '%');
      }
      return o;
    });
    var cur = el('line', {y1: UT - 6, y2: LB, 'class': 'cursor'}, svg);

    var r = result(res, '186/190', 'weekday slots within the 5% abandonment cap', 'Orange: slots over the cap');
    var segs = [['Textbook formula', 41, 'bar-u'], ['Certified plan', 186, 'bar-c']].map(function(b){
      var row = h('div', 'res-bar', r.viz);
      h('span', '', row, b[0] + ' · ' + b[1] + '/190');
      var tr = h('span', 'res-track', row);
      return {ok: h('i', b[2], tr), bad: h('i', 'bar-bad', tr), n: b[1]};
    });

    return {
      captions: [
        'After a surge, waiting callers spill into the next half hour. A formula assuming a fresh start loses 11% there.',
        'Ours certifies each half hour in order, carrying every waiting caller forward, and adds staff only where the test fails.',
        'In a simulation calibrated to a hospital contact centre: 186 of 190 weekday slots meet the cap, against 41.'
      ],
      render: function(t){
        var s1 = p(t, .2, 3.6), s2 = p(t, 5, 8.2);
        c1.setAttribute('width', s1 * (X1 - X0));
        c2.setAttribute('width', s2 * (X1 - X0));
        op(capf, lerp(1, .3, p(t, 4.6, 5))); op(leg, p(t, 0, .5));
        legCap.setAttribute('class', t >= ACT[1] ? 'cap-c' : 'cap-f');
        bars.forEach(function(b, k){
          var end = (k + 1) / K;
          bar(b.f, LB, hl(RF[k]) * ease(p(s1, end - .02, end + .06)));
          bar(b.c, LB, hl(RC[k]) * ease(p(s2, end - .02, end + .06)));
          if (b.ft){ op(b.ft, p(s1, end, end + .06)); op(b.ct, p(s2, end, end + .06)); }
        });
        fail.forEach(function(k, i){
          var end = (k + 1) / K, fixed = s2 >= end;
          op(band[i], p(s1, end, end + .05));
          band[i].setAttribute('class', fixed ? 'warn fixed' : 'warn');
        });
        ticks.forEach(function(e, k){ op(e, p(s2, (k + .7) / K, (k + 1) / K)); });
        var sweep = t < ACT[1] ? s1 : s2, moving = (t > .2 && t < 3.6) || (t > 5 && t < 8.2);
        cur.setAttribute('x1', X0 + sweep * (X1 - X0)); cur.setAttribute('x2', X0 + sweep * (X1 - X0));
        op(cur, moving ? 1 : 0);
        var g = ease(p(t, 9.3, 10.8));
        segs.forEach(function(sg){
          sg.ok.style.width = (sg.n / 190 * 100 * g) + '%';
          sg.bad.style.width = ((190 - sg.n) / 190 * 100 * g) + '%';
        });
        op(r.viz, p(t, 9.1, 9.4)); op(r.big, p(t, 10.6, 11.1)); op(r.label, p(t, 10.6, 11.1)); op(r.note, p(t, 11.2, 11.7));
      }
    };
  }

  var BUILD = {ri: ri, cone: cone, staff: staff};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FIXED = /[?&]anim=([\d.]+)/.exec(location.search);
  FIXED = FIXED ? +FIXED[1] : null;

  document.querySelectorAll('.anim').forEach(function(fig){
    var svg = fig.querySelector('svg.anim-main'), res = fig.querySelector('.anim-result');
    var capEl = fig.querySelector('.anim-cap'), acts = fig.querySelectorAll('.acts button');
    var replay = fig.querySelector('.anim-replay');
    var api = BUILD[fig.dataset.anim](svg, res);
    var raf = null, t0 = null, act = -1;

    function setAct(i){
      if (i === act) return;
      act = i;
      acts.forEach(function(b, k){ b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      capEl.textContent = api.captions[i];
    }
    function draw(t){ api.render(t); setAct(t >= ACT[2] ? 2 : t >= ACT[1] ? 1 : 0); }
    function stop(){ if (raf) cancelAnimationFrame(raf); raf = null; }
    function frame(ts){
      if (t0 === null) t0 = ts;
      var t = Math.min((ts - t0) / 1000, END);
      draw(t);
      raf = t < END ? requestAnimationFrame(frame) : null;
    }
    function play(){ stop(); t0 = null; raf = requestAnimationFrame(frame); }

    if (FIXED != null){ draw(FIXED); return; }    // ?anim=SECONDS: draw one moment, for checking
    draw(END);                                   // a complete figure before it ever plays
    acts.forEach(function(b, k){
      b.addEventListener('click', function(){ stop(); draw(k < 2 ? ACT[k + 1] - .001 : END); });
    });
    replay.addEventListener('click', play);
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ io.disconnect(); play(); } });
    }, {threshold: .6});
    io.observe(fig);
  });
})();
