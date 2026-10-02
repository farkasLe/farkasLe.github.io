/* Research animations. Each figure plays three acts -- the problem, the method, the
   result -- and is drawn by one render(t), a pure function of time, so any moment can be
   shown directly: the act labels jump to the end of their act, and reduced motion gets
   the final frame. Pacing: one change at a time, with a pause after each, so the eye
   can follow. The problem act is its own scene: what is decided and what makes it
   hard; a card beside it states the problem until the result replaces it. In the method
   act colour carries the contrast: gray is the standard approach, teal is ours, orange
   is a failure. Data: anim-data.js (built by make_anim_data.py). */
(function(){
  var D = window.ANIM_DATA;
  if (!D || !document.querySelector('.anim')) return;

  var NS = 'http://www.w3.org/2000/svg';

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
  function txt(e, s){ if (e.textContent !== s) e.textContent = s; }
  function cls(e, c){ if (e.getAttribute('class') !== c) e.setAttribute('class', c); }

  /* The right column. Through the problem and method acts a card states the problem
     (what is decided, what it faces, the goal), its rows arriving as the scene shows
     them; when the result act begins the result takes its place. Both share one grid
     cell, so the column keeps its height. */
  function result(res, card, big, label, note){
    var c = h('dl', 'res-card', res);
    var rows = card.map(function(it){
      var d = h('div', '', c);
      h('dt', '', d, it[0]);
      h('dd', '', d, it[1]);
      return d;
    });
    var m = h('div', 'res-main', res);
    var r = {big: h('p', 'res-big', m, big), label: h('p', 'res-label', m, label)};
    r.viz = h('div', 'res-viz', m);
    r.note = h('p', 'res-note', m, note);
    r.swap = function(t, at, from){
      rows.forEach(function(d, k){ op(d, p(t, at[k], at[k] + .5)); });
      var s = p(t, from, from + .4);
      op(c, 1 - s); op(m, s);
      c.style.visibility = s === 1 ? 'hidden' : '';
      m.style.visibility = s === 0 ? 'hidden' : '';
    };
    return r;
  }

  /* ------------------------------------------------------------------ RI pricing */
  /* Problem: bags are sold as a menu -- five tiers and "no bag" -- so one price moves
     shoppers across the whole menu (dots: illustrative shoppers). Method: each row's
     price tag gives way to an eye showing how closely shoppers watch that price, and
     each price splits into a gray base (cost + demand level) and a teal attention markup,
     short where the eye is dark and long where it is faint -- the paper's price
     decomposition, read row by row -- against the equal-gap rule table (ticks). */
  function ri(svg, res){
    var ACTS = [0, 9, 20], END = 26;
    var ATT = [100, 6.98, 4.24, 0.25, 1.25], ATT_TXT = ['100', '7', '4', '≈0', '1'];
    var RULE = [40, 52, 64, 76, 88];                 // illustrative rule table, equal gaps; also the menu
    var BASE = [22, 26, 30, 34, 38];                 // illustrative cost + demand level
    var MARK = [8, 20, 34, 50, 66];                  // illustrative attention markup
    var X0 = 124, U = 2.3, Y = [30, 66, 102, 138, 174, 210], BH = 18;   // last row: no bag
    var SHOP = [10, 4, 3, 1, 2, 20], DX = 104, DS = 8;                   // illustrative shoppers, 40 in all
    var MOVE = [[9, 1, 4], [8, 5, 20], [7, 5, 21]];  // after the 20 kg price rises: slot -> row, slot

    var prob = el('g', {}, svg), meth = el('g', {}, svg);
    el('text', {x: 62, y: 12, 'class': 'lbl', 'text-anchor': 'middle'}, prob, 'Price');
    el('text', {x: DX - 3, y: 12, 'class': 'lbl'}, prob, 'Shoppers who choose it');
    Y.forEach(function(y, i){
      el('text', {x: 0, y: y + 5, 'class': 'lbl mid'}, i < 5 ? svg : prob, i < 5 ? (20 + 5 * i) + ' kg' : 'No bag');
    });
    var tags = RULE.map(function(v, i){
      return {r: el('rect', {x: 40, y: Y[i] - 10, width: 44, height: 20, rx: 4, 'class': 'ptag'}, prob),
              t: el('text', {x: 62, y: Y[i] + 4.5, 'class': 'ptag-t num', 'text-anchor': 'middle'}, prob, '$' + v)};
    });
    var up = el('text', {x: 89, y: Y[0] + 5, 'class': 'up'}, prob, '↑');
    var dots = [];
    SHOP.forEach(function(cnt, i){
      for (var j = 0; j < cnt; j++) dots.push({j: j, n: dots.length, e: el('circle', {r: 3, cy: Y[i], 'class': 'shop'}, prob)});
    });
    var movers = MOVE.map(function(m, k){
      var S = [DX + DS * m[0], Y[0]], E = [DX + DS * m[2], Y[m[1]]];
      return {d: dots[m[0]], S: S, E: E, C: [Math.max(S[0], E[0]) + 70, (S[1] + E[1]) / 2], t0: 5.3 + .5 * k};
    });
    var said = el('g', {}, prob);
    el('text', {x: DX + DS * 4 + 9, y: Y[1] + 4.5, 'class': 'lbl strong'}, said, 'switch');
    el('text', {x: DX + DS * 21 + 9, y: Y[5] + 4.5, 'class': 'lbl strong'}, said, 'skip');

    el('text', {x: 62, y: 12, 'class': 'lbl', 'text-anchor': 'middle'}, meth, 'shoppers watch');
    el('text', {x: X0, y: 12, 'class': 'lbl'}, meth, 'Price · illustrative');
    var rows = RULE.map(function(rule, i){
      var y = Y[i], r = {}, ours = BASE[i] + MARK[i];
      r.eye = el('g', {transform: 'translate(62 ' + y + ')', 'class': 'eye'}, meth);
      el('path', {d: 'M-12 0Q0 -9 12 0Q0 9 -12 0Z'}, r.eye);
      el('circle', {r: 3.4}, r.eye);
      r.att = el('text', {x: 84, y: y + 4, 'class': 'lbl num'}, meth, ATT_TXT[i]);
      r.base = el('rect', {x: X0, y: y - BH / 2, height: BH, 'class': 'b-data'}, meth);
      r.mark = el('rect', {x: X0 + BASE[i] * U, y: y - BH / 2, height: BH, 'class': 'b-ours'}, meth);
      r.tick = el('line', {x1: X0 + rule * U, x2: X0 + rule * U, y1: y - BH / 2 - 4, y2: y + BH / 2 + 4, 'class': 'rule-tick'}, meth);
      r.arrow = el('text', {x: X0 + Math.max(ours, rule) * U + 6, y: y + 5, 'class': 'arrow-s'}, meth,
                   ours < rule ? '↓ lower' : ours > rule ? '↑ higher' : '');
      return r;
    });
    var legTick = el('g', {}, meth);
    el('line', {x1: 330, x2: 330, y1: 2, y2: 14, 'class': 'rule-tick'}, legTick);
    el('text', {x: 336, y: 12, 'class': 'lbl'}, legTick, 'rule-table price');
    var legs = [['b-data', 'cost + demand level', X0], ['b-ours', 'attention markup', X0 + 136]].map(function(it){
      var g = el('g', {}, meth);
      el('rect', {x: it[2], y: 202, width: 9, height: 9, 'class': it[0]}, g);
      el('text', {x: it[2] + 14, y: 210, 'class': 'lbl'}, g, it[1]);
      return g;
    });

    var r = result(res, [['Decide', 'five bag prices, together'], ['Shoppers', 'choose one tier, or none'], ['Goal', 'most baggage revenue']],
                   '+7.8%', 'baggage revenue per booking session', 'vs uniform pricing, randomized field test (p < 0.01)');
    var row = h('p', 'res-row', r.viz);
    h('span', '', row, 'Average price');
    h('b', 'res-down', row, '↓ lower');

    return {
      acts: ACTS, end: END,
      captions: [
        'Bags are sold as a menu. Raise one price, and shoppers switch tiers or skip the bag.',
        'Shoppers watch the 20 kg price closely, others barely. Ours marks up where attention is low; rule tables keep equal gaps.',
        'In a randomized field test, baggage revenue rose 7.8% while the average price fell.'
      ],
      render: function(t){
        // the problem: the menu, its shoppers; then the 20 kg price rises and three leave it
        op(prob, p(t, 0, .6) * (1 - p(t, ACTS[1], ACTS[1] + .6)));
        dots.forEach(function(d){
          var a = .9 + 2.2 * d.n / dots.length, s = ease(p(t, a, a + .5));
          d.e.setAttribute('cx', DX + DS * d.j + 24 * (1 - s));
          op(d.e, s);
        });
        movers.forEach(function(mv){
          var u = ease(p(t, mv.t0, mv.t0 + 1)), v = 1 - u;
          if (t < mv.t0){ cls(mv.d.e, 'shop'); mv.d.e.setAttribute('cy', mv.S[1]); return; }
          cls(mv.d.e, 'shop mv');
          mv.d.e.setAttribute('cx', v * v * mv.S[0] + 2 * v * u * mv.C[0] + u * u * mv.E[0]);
          mv.d.e.setAttribute('cy', v * v * mv.S[1] + 2 * v * u * mv.C[1] + u * u * mv.E[1]);
        });
        cls(tags[0].r, t >= 4 && t < ACTS[1] ? 'ptag hot' : 'ptag');
        txt(tags[0].t, t >= 4.5 ? '$46' : '$40');
        op(up, p(t, 4, 4.4)); op(said, p(t, 7.4, 7.9));
        // the method: eyes, then the rule table, then our price built from base + markup
        op(meth, p(t, 9.4, 10));
        var e = ease(p(t, 10.4, 11.8)), b = ease(p(t, 14, 15)), m = ease(p(t, 15.4, 17));
        rows.forEach(function(rw, i){
          op(rw.eye, lerp(.12, Math.max(.12, ATT[i] / 100), e));   // dark only where shoppers look
          op(rw.att, p(t, 11.6, 12.1));
          op(rw.tick, p(t, 12.8, 13.4));
          rw.base.setAttribute('width', BASE[i] * U * b);
          rw.mark.setAttribute('width', MARK[i] * U * m);
          op(rw.arrow, p(t, 17.3, 17.9));
        });
        op(legTick, p(t, 12.8, 13.4)); op(legs[0], p(t, 14, 14.4)); op(legs[1], p(t, 15.4, 15.8));
        // the result
        var v = 7.8 * ease(p(t, 20.5, 22));
        txt(r.big, '+' + v.toFixed(1) + '%');
        op(r.big, p(t, 20.3, 20.7)); op(r.label, p(t, 20.3, 20.7));
        op(r.viz, p(t, 22.4, 23)); op(r.note, p(t, 23.4, 24));
        r.swap(t, [.4, 5.3, 7.6], ACTS[2]);
      }
    };
  }

  /* ------------------------------------------------------------------ CONE */
  /* Problem, in four beats along one slice of contexts: (1) each option's cost is a
     curve over the context, and the curves cross; (2) the lowest curve is the answer,
     read off as a strip -- the rule, cheapest option per context; (3) only noisy runs
     are seen, and near the crossings (shaded: close calls) they cannot tell the options
     apart; (4) the strip shrinks into its line on the square of contexts, where the rule
     is a map and close calls line its borders. Method: uniform sampling and CONE spend
     the same 700 runs, side by side. */
  function cone(svg, res){
    var ACTS = [0, 14, 25], END = 31;
    var c = D.cone, G = c.grid, S = 190, TOP = 26, X = [10, 220], cell = S / G, N = c.budget;
    var LET = 'ABC';

    // the rule: each option's region, as vertical runs of grid cells, under everything
    var regions = el('g', {'shape-rendering': 'crispEdges'}, svg);
    for (var o = 0; o < 3; o++){
      var rg = el('g', {'class': 'opt' + o}, regions), code = String(o);
      for (var i = 0; i < G; i++){
        var j = 0;
        while (j < G){
          if (c.best[i * G + j] !== code){ j++; continue; }
          var j0 = j;
          while (j < G && c.best[i * G + j] === code) j++;
          el('rect', {x: (X[0] + i * cell).toFixed(2), y: (TOP + S - j * cell).toFixed(2),
                      width: (cell + .5).toFixed(2), height: ((j - j0) * cell + .5).toFixed(2)}, rg);
        }
      }
    }

    var panels = X.map(function(x0, k){
      var g = el('g', {}, svg), d = '';
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
      var head = el('g', {}, svg);
      el('text', {x: x0, y: TOP - 9, 'class': k ? 'lbl ours' : 'lbl strong'}, head, k ? 'CONE' : 'Uniform sampling');
      var count = el('text', {x: x0 + S, y: TOP - 9, 'class': 'lbl num', 'text-anchor': 'end'}, head);
      var stat = el('text', {x: x0, y: TOP + S + 20, 'class': k ? 'stat ours' : 'stat'}, svg);
      return {g: g, head: head, dots: dots, close: close, shown: 0, hits: 0, count: count, stat: stat};
    });
    function upto(pn, n){
      var i;
      if (n > pn.shown) for (i = pn.shown; i < n; i++){ pn.dots[i].setAttribute('visibility', 'visible'); if (pn.close[i] === '1') pn.hits++; }
      else for (i = n; i < pn.shown; i++){ pn.dots[i].setAttribute('visibility', 'hidden'); if (pn.close[i] === '1') pn.hits--; }
      pn.shown = n;
      txt(pn.count, n + ' runs');
      txt(pn.stat, n ? Math.round(100 * pn.hits / n) + '% of runs on close calls' : '');
    }

    // the problem's own layer: one slice of contexts, drawn as a plot across the figure
    var F = c.sl_f, NS = F.length / 3, ZN = c.sl_zone, RU = c.runs, NR = RU.length / 3;
    var PL = 22, PR = 394, PT = 30, PB = 166, F0 = -200, F1 = 560, SY = 176, SH = 16;
    function sx(u){ return PL + u * (PR - PL); }
    function sy(v){ return PB - (v - F0) / (F1 - F0) * (PB - PT); }
    function fi(o, i){ return F[3 * i + o]; }
    var best = [];
    for (i = 0; i < NS; i++){
      var b = 0;
      for (o = 1; o < 3; o++) if (fi(o, i) < fi(b, i)) b = o;
      best.push(b);
    }
    var defs = el('defs', {}, svg), id = 'cn' + Math.random().toString(36).slice(2, 7);
    var clipC = el('rect', {x: 0, y: 0, height: 244, width: 0}, el('clipPath', {id: id + 'c'}, defs));
    var clipE = el('rect', {x: 0, y: 0, height: 244, width: 0}, el('clipPath', {id: id + 'e'}, defs));

    var tA = el('text', {x: X[0], y: TOP - 9, 'class': 'lbl strong'}, svg, 'Cost of each option, by context');
    var tB = el('text', {x: X[0], y: TOP - 9, 'class': 'lbl strong'}, svg, 'The rule: best option by context');
    var plot = el('g', {}, svg);
    var zb = el('g', {}, plot), zl = [];                 // close calls along the slice
    for (i = 0; i < NS; i++){
      if (ZN[i] !== '1' || (i && ZN[i - 1] === '1')) continue;
      j = i;
      while (j + 1 < NS && ZN[j + 1] === '1') j++;
      var za = sx((i - .5) / (NS - 1)), zz = sx((j + .5) / (NS - 1));
      el('rect', {x: za, y: PT - 6, width: zz - za, height: PB + 10 - PT, 'class': 'zone'}, zb);
      zl.push(el('text', {x: (za + zz) / 2, y: PT + 6, 'class': 'lbl strong', 'text-anchor': 'middle'}, zb, 'close call'));
    }
    el('line', {x1: PL, x2: PR, y1: PB + 4, y2: PB + 4, 'class': 'axis'}, plot);
    var curves = el('g', {'clip-path': 'url(#' + id + 'c)'}, plot), tips = [];
    for (o = 0; o < 3; o++){
      var pp = [];
      for (i = 0; i < NS; i++) pp.push(sx(i / (NS - 1)).toFixed(1) + ',' + sy(fi(o, i)).toFixed(1));
      el('polyline', {points: pp.join(' '), 'class': 'cv'}, curves);
      tips.push(el('text', {'class': 'lbl strong'}, plot, LET[o]));
    }
    var pe = [];
    for (i = 0; i < NS; i++) pe.push(sx(i / (NS - 1)).toFixed(1) + ',' + sy(fi(best[i], i)).toFixed(1));
    var env = el('polyline', {points: pe.join(' '), 'class': 'env', 'clip-path': 'url(#' + id + 'e)'}, plot);
    var runs = el('g', {}, plot), rd = [];
    for (i = 0; i < NR; i++) for (o = 0; o < 3; o++){
      var v = RU[3 * i + o];
      if (v < F0 || v > F1) continue;
      rd.push({e: el('circle', {cx: sx((i + .5) / NR).toFixed(1), cy: sy(v).toFixed(1), r: 1.9, 'class': 'run'}, runs), u: (i + .5) / NR});
    }
    var runL = el('g', {}, plot);                       // legend for the runs, in the empty corner
    el('circle', {cx: PL + 5, cy: PB - 7, r: 1.9, 'class': 'run'}, runL);
    el('text', {x: PL + 12, y: PB - 3, 'class': 'lbl'}, runL, 'one simulation run');
    var ruleT = el('text', {x: PL, y: SY + SH + 17, 'class': 'lbl strong'}, plot, 'The rule: cheapest option at each context');
    el('text', {x: PR, y: SY + SH + 17, 'class': 'lbl', 'text-anchor': 'end'}, plot, 'context →');

    // the rule along the slice: a strip that later shrinks into its line on the square
    var strip = el('g', {}, svg), sbody = el('g', {'clip-path': 'url(#' + id + 'e)'}, strip), sl = [];
    for (i = 0; i < NS; i++){
      if (i && best[i] === best[i - 1]) continue;
      j = i;
      while (j + 1 < NS && best[j + 1] === best[i]) j++;
      var a0 = sx(Math.max(i - .5, 0) / (NS - 1)), a1 = sx(Math.min(j + .5, NS - 1) / (NS - 1));
      el('rect', {x: a0, y: SY, width: a1 - a0, height: SH, 'class': 'opt' + best[i]}, sbody);
      sl.push({e: el('text', {x: (a0 + a1) / 2, y: SY + 12, 'class': 'lbl strong', 'text-anchor': 'middle'}, strip, LET[best[i]]),
               u: (i + j) / 2 / (NS - 1)});
    }
    var sframe = el('rect', {x: PL, y: SY, width: PR - PL, height: SH, 'class': 'frame', 'vector-effect': 'non-scaling-stroke'}, strip);
    var YL = TOP + S - c.slice * S, M1 = S / (PR - PL), M2 = .25;   // the slice's line on the square

    var mapG = el('g', {}, svg);
    [[.15, .3], [.8, .3], [.6, .82]].forEach(function(at, o){       // inside each region, clear of the slice
      el('text', {x: X[0] + at[0] * S, y: TOP + S - at[1] * S + 7, 'class': 'reg-l', 'text-anchor': 'middle'}, mapG, LET[o]);
    });
    var sliceL = el('g', {}, mapG);
    el('line', {x1: X[0], x2: X[0] + S, y1: YL, y2: YL, 'class': 'slice'}, sliceL);
    el('text', {x: X[0] + S + 6, y: YL + 4, 'class': 'lbl'}, sliceL, '← the slice');
    el('text', {x: X[0], y: TOP + S + 20, 'class': 'lbl'}, mapG, 'Each point is one context');

    var R = c.reach90, a = Math.round(R.cone / 10) * 10, bb = Math.round(R.unif / 10) * 10;
    var r = result(res, [['Find', 'the best of 3 options, per context'], ['From', 'noisy simulation runs'], ['Budget', N + ' runs']],
                   '~' + a, 'runs to reach 90% correct decisions', 'Uniform sampling needs ~' + bb);
    var ch = el('svg', {viewBox: '0 0 160 100', 'class': 'res-chart', 'aria-hidden': 'true'});
    r.viz.appendChild(ch);
    function cx(t){ return 4 + t / N * 152; }
    function cy(v){ return 94 - (Math.max(v, .7) - .7) / .27 * 80; }
    el('line', {x1: 4, x2: 156, y1: cy(.9), y2: cy(.9), 'class': 'ref'}, ch);
    el('text', {x: 156, y: cy(.9) + 11, 'class': 'tiny', 'text-anchor': 'end'}, ch, '90% correct');
    function line(acc, cl){
      return el('polyline', {points: c.t.map(function(t, i){ return cx(t).toFixed(1) + ',' + cy(acc[i]).toFixed(1); }).join(' '),
                             pathLength: 1, 'class': cl}, ch);
    }
    var lu = line(c.acc_unif, 'ln-u'), lc = line(c.acc_cone, 'ln-c');
    var gap = el('g', {}, ch);
    el('line', {x1: cx(R.cone), x2: cx(R.unif), y1: cy(.9) - 9, y2: cy(.9) - 9, 'class': 'gap'}, gap);
    el('text', {x: (cx(R.cone) + cx(R.unif)) / 2, y: cy(.9) - 13, 'class': 'tiny ours', 'text-anchor': 'middle'}, gap,
       Math.round(100 * (1 - R.cone / R.unif)) + '% fewer runs');
    var mu = el('circle', {cx: cx(R.unif), cy: cy(.9), r: 3.2, 'class': 'mk-u'}, ch);
    var mc = el('circle', {cx: cx(R.cone), cy: cy(.9), r: 3.2, 'class': 'mk-c'}, ch);

    var T = {curves: [1, 4], rule: [4.8, 6.8], runs: [8, 9.8], close: 10.2, map: [11.6, 12.8]};   // problem beats
    var BEATS = [
      [0, 'Each option’s cost depends on the context, such as demand or patient mix. The cheapest option changes.'],
      [T.rule[0], 'The goal is a prescriptive rule: the cheapest option for every context.'],
      [T.runs[0] - .4, 'But costs are seen only through noisy, costly simulation runs. Near crossings, the best option is a close call.'],
      [T.map[0], 'Here contexts have two features, so the rule is a map. Close calls line its borders.']
    ];
    return {
      acts: ACTS, end: END,
      captions: [
        BEATS[3][1],
        'Uniform sampling spreads runs evenly. CONE moves them to close calls, where the rule is hard to learn.',
        'So it reaches 90% correct decisions after about ' + a + ' runs; uniform sampling needs about ' + bb + '.'
      ],
      captionAt: function(t){
        if (t >= ACTS[1]) return null;
        for (var i = BEATS.length - 1; i > 0; i--) if (t >= BEATS[i][0]) return BEATS[i][1];
        return BEATS[0][1];
      },
      render: function(t){
        // (1) the curves draw left to right, each letter riding its tip
        var u = ease(p(t, T.curves[0], T.curves[1])), k = Math.min(Math.floor(u * (NS - 1)), NS - 2), w = u * (NS - 1) - k;
        clipC.setAttribute('width', u ? sx(u) + 1 : 0);
        tips.forEach(function(e, o){
          e.setAttribute('x', sx(u) + 5); e.setAttribute('y', lerp(sy(fi(o, k)), sy(fi(o, k + 1)), w) + 4);
          op(e, p(t, T.curves[0], T.curves[0] + .3));
        });
        // (2) the lowest curve, and the strip of cheapest options under it
        var e2 = ease(p(t, T.rule[0], T.rule[1]));
        clipE.setAttribute('width', e2 ? sx(e2) + 1 : 0);
        sl.forEach(function(s){ op(s.e, p(e2, s.u, s.u + .08) * (1 - p(t, T.map[0], T.map[0] + .3))); });
        op(ruleT, p(t, T.rule[0], T.rule[0] + .5));
        op(sframe, p(t, T.rule[0], T.rule[0] + .3));
        // (3) the true curves step back; the noisy runs are what we get; close calls shaded
        var dim = 1 - .65 * p(t, T.runs[0] - .4, T.runs[0]);
        op(curves, dim); op(env, dim);
        var e3 = p(t, T.runs[0], T.runs[1]);
        rd.forEach(function(d){ op(d.e, p(e3 * 1.06, d.u, d.u + .05)); });
        op(runL, p(t, T.runs[0], T.runs[0] + .4));
        op(zb, p(t, T.close, T.close + .6));
        // (4) the plot gives way; the strip shrinks into its line on the square of contexts
        op(plot, p(t, .3, .8) * (1 - p(t, T.map[0], T.map[0] + .5)));
        var m = ease(p(t, T.map[0] + .2, T.map[1]));
        strip.setAttribute('transform', 'matrix(' + lerp(1, M1, m) + ' 0 0 ' + lerp(1, M2, m) + ' ' +
                           lerp(0, X[0] - PL * M1, m) + ' ' + lerp(0, YL - (SY + SH / 2) * M2, m) + ')');
        op(strip, 1 - p(t, T.map[1], T.map[1] + .4));
        var mp = p(t, T.map[0] + .5, T.map[1]), out = 1 - p(t, ACTS[1], ACTS[1] + .6);
        op(regions, mp * out); op(mapG, mp * out); op(sliceL, p(t, T.map[1], T.map[1] + .3));
        op(panels[0].g, mp);
        op(tA, p(t, .3, .8) * (1 - p(t, T.map[0], T.map[0] + .4)));
        op(tB, p(t, T.map[1] - .2, T.map[1] + .3) * (1 - p(t, ACTS[1], ACTS[1] + .4)));
        // the method: the same 700 runs, spent two ways
        var mth = p(t, ACTS[1] + .6, ACTS[1] + 1.2);
        op(panels[1].g, mth); op(panels[0].head, mth); op(panels[1].head, mth);
        upto(panels[0], Math.round(N * p(t, ACTS[1] + 1.5, ACTS[1] + 9)));
        upto(panels[1], Math.round(N * p(t, ACTS[1] + 1.5, ACTS[1] + 9)));
        // the result
        var R0 = ACTS[2], d = p(t, R0 + .3, R0 + 2.3);
        lu.style.strokeDashoffset = 1 - d; lc.style.strokeDashoffset = 1 - d;
        op(mu, p(t, R0 + 2.5, R0 + 2.9)); op(mc, p(t, R0 + 2.5, R0 + 2.9)); op(gap, p(t, R0 + 3.1, R0 + 3.6));
        op(r.big, p(t, R0 + 3.8, R0 + 4.3)); op(r.label, p(t, R0 + 3.8, R0 + 4.3));
        op(r.viz, p(t, R0 + .1, R0 + .4)); op(r.note, p(t, R0 + 4.5, R0 + 5));
        r.swap(t, [.4, T.runs[0], T.map[1]], ACTS[2]);
      }
    };
  }

  /* ------------------------------------------------------------------ staffing */
  /* Problem: a morning of half-hour slots, each with a staffing level to choose. Calls
     and patience both shift through the morning; callers still waiting when a slot ends
     carry into the next; every slot must keep hang-ups under the cap. Method, on the same
     toy morning, with staff drawn as bars against the calls (bar height: calls the staff
     can answer, so a bar under the line means callers pile up) and the waiting line
     below: (1) the textbook plan sizes each slot as if it starts empty, the surge leaves
     a backlog and hang-ups break the cap; (2) certificates test the slots in order with
     the callers each inherits and add staff until each passes -- 9:30 inherits the
     backlog and needs a crowd to clear it; (3) staffing ahead lifts the surge slot to
     keep pace with the calls, no backlog forms, and 9:30 needs far fewer: every slot
     still certified, with fewer staff. */
  function staff(svg, res){
    var ACTS = [0, 10, 26.5], END = 32.5;
    var s = D.staff, K = s.slots, M = K * 30, X0 = 34, X1 = 414, PX = (X1 - X0) / M, cap = s.cap, mu = s.mu;
    var lam = s.lam, pat = s.pat, EM = s.empty, MY = s.myopic, AH = s.ahead, W = s.wait;
    var BE = s.bad_empty, BM = s.bad_myopic, BA = s.bad_ahead;
    var UT = 14, UB = 80, BY = 100, BH = 22, NOTE = 137, QT = 156, QB = 188, HT = 210, MARK = 230, PMAX = 240;
    var lmax = 1.05 * Math.max(Math.max.apply(null, lam), mu * Math.max.apply(null, MY.concat(AH)));
    var qmax = Math.max.apply(null, W.map(function(w){ return Math.max.apply(null, w); }));
    function x(m){ return X0 + m * PX; }
    function mid(k){ return x(k * 30 + 15); }
    function clock(k){ var m = 480 + k * 30; return Math.floor(m / 60) + ':' + (m % 60 ? '30' : '00'); }
    function yu(v){ return UB - v / lmax * (UB - UT); }
    function yp(v){ return UB - v / PMAX * (UB - UT); }
    function yq(v){ return QB - v / qmax * (QB - QT); }
    function poly(v, y){ return v.map(function(u, i){ return x(i * 2).toFixed(1) + ',' + y(u).toFixed(1); }).join(' '); }
    var moved = [], sumM = 0, sumA = 0;
    MY.forEach(function(n, k){ sumM += n; sumA += AH[k]; if (AH[k] !== n) moved.push(k); });
    var early = moved[0], late = moved[1], saved = Math.round(100 * (1 - sumA / sumM));
    var worst = BE.indexOf(Math.max.apply(null, BE)), fix = MY[worst] - EM[worst];
    // method beats: the textbook plan plays out; certificates slot by slot (pausing on the
    // slot that inherits the backlog); then staffing ahead, one slot at a time
    var T = {plan: 10.8, sweep: [11.6, 14.6], ahead: 20.2, late: 22.6, total: 23.8}, CS = [], DU = [], c0 = 15;
    for (var k = 0; k < K; k++){ CS.push(c0); DU.push(k === worst ? 1 : .35); c0 += k === worst ? 1.6 : .4; }

    var defs = el('defs', {}, svg), id = 'st' + Math.random().toString(36).slice(2, 7);
    var clipR = el('rect', {x: X0, y: 0, height: UB + 4, width: 0}, el('clipPath', {id: id}, defs));
    var clipM = el('rect', {x: X0, y: 0, height: QB + 4, width: 0}, el('clipPath', {id: id + 'm'}, defs));

    var frame = el('g', {}, svg);
    [0, 60, 120, 180, 240].forEach(function(m){
      el('text', {x: x(m), y: UB + 13, 'class': 'lbl', 'text-anchor': 'middle'}, frame, (8 + m / 60) + ':00');
    });
    el('line', {x1: X0, x2: X1, y1: UB, y2: UB, 'class': 'axis'}, frame);
    el('text', {x: 0, y: BY + 15.5, 'class': 'lbl'}, frame, 'staff');
    var marksH = el('text', {x: X0, y: HT, 'class': 'lbl'}, svg, 'Hang-ups within 5%, on a 1-in-20 bad day');

    // the method's picture, revealed as the textbook morning plays: staff bars, waiting line
    var played = el('g', {'clip-path': 'url(#' + id + 'm)'}, svg);
    var bars = EM.map(function(n, k){ return el('rect', {x: x(k * 30) + 2, width: 30 * PX - 4}, played); });
    var qArea = el('path', {'class': 'q-area'}, played);
    var lane2 = el('g', {}, svg);
    el('text', {x: X0, y: QT - 8, 'class': 'lbl'}, lane2, 'Callers waiting');
    el('line', {x1: X0, x2: X1, y1: QB, y2: QB, 'class': 'axis'}, lane2);
    var cursor = el('line', {y1: UT - 4, y2: QB, 'class': 'cursor'}, svg);

    // the problem: demand and patience shift, slots wait for a decision, callers carry over
    var A = el('g', {'clip-path': 'url(#' + id + ')'}, svg);
    el('polyline', {points: poly(lam, yu), 'class': 'ln-d'}, A);
    var patL = el('polyline', {points: poly(pat, yp), 'class': 'ln-p'}, A);
    var lamT = el('text', {x: x(165), y: yu(lam[lam.length - 1]) - 6, 'class': 'lbl', 'text-anchor': 'middle'}, svg, 'calls arriving');
    var patT = el('text', {x: X1, y: yp(pat[pat.length - 1]) - 6, 'class': 'lbl', 'text-anchor': 'end'}, svg, 'patience');
    var staffT = el('text', {x: x(60) - 5, y: yu(mu * EM[early]) + 4, 'class': 'lbl', 'text-anchor': 'end'}, svg, 'staff on duty');
    var boxes = EM.map(function(n, k){
      return el('rect', {x: mid(k) - 15, y: BY, width: 30, height: BH, rx: 3, 'class': 'slot'}, svg);
    });
    function num(k, v, c){ return el('text', {x: mid(k), y: BY + 15.5, 'class': c, 'text-anchor': 'middle'}, svg, v); }
    var qs = EM.map(function(n, k){ return num(k, '?', 'qm'); });
    var ne = EM.map(function(n, k){ return num(k, n, 'nb'); });
    var nm = MY.map(function(n, k){ return num(k, n, 'nb ours'); });
    var na = moved.map(function(k){ return num(k, AH[k], 'nb ours'); });
    var arrows = EM.slice(1).map(function(n, k){
      var xb = x(k * 30 + 30), y = BY + BH / 2;
      return el('path', {d: 'M' + (xb - 7) + ' ' + (y - 1.5) + 'H' + (xb + 2) + 'V' + (y - 4) + 'L' + (xb + 7) + ' ' + y +
                            'L' + (xb + 2) + ' ' + (y + 4) + 'V' + (y + 1.5) + 'H' + (xb - 7) + 'Z', 'class': 'carry'}, svg);
    });
    var carT = el('text', {x: x(120), y: NOTE, 'class': 'lbl strong', 'text-anchor': 'middle'}, svg, 'callers still waiting carry over');

    // one mark per slot: ? until tested, then within the cap or not
    var marks = EM.map(function(n, k){ return el('text', {x: mid(k), y: MARK, 'text-anchor': 'middle'}, svg); });
    var worstT = el('text', {x: mid(worst) + 9, y: MARK, 'class': 'lbl warn-t'}, svg, Math.round(100 * BE[worst]) + '%');
    var iq = Math.round((worst * 30) / 2), peakT = el('g', {}, svg);   // the backlog the slot inherits
    el('circle', {cx: x(worst * 30), cy: yq(W[K][iq]), r: 2.5, 'class': 'pk'}, peakT);
    el('text', {x: x(worst * 30) + 7, y: yq(W[K][iq]) + 4, 'class': 'lbl strong'}, peakT, Math.round(W[K][iq]) + ' waiting at ' + clock(worst));
    var notes = [
      el('text', {x: mid(worst), y: NOTE, 'class': 'lbl ours', 'text-anchor': 'middle'}, svg, '+' + fix),
      el('text', {x: mid(early), y: NOTE, 'class': 'lbl ours', 'text-anchor': 'middle'}, svg, '+' + (AH[early] - MY[early])),
      el('text', {x: mid(late), y: NOTE, 'class': 'lbl ours', 'text-anchor': 'middle'}, svg, '−' + (MY[late] - AH[late])),
      el('text', {x: X1, y: NOTE, 'class': 'lbl ours', 'text-anchor': 'end'}, svg,
         'Staff-slots: ' + sumM + ' → ' + sumA + ' (−' + saved + '%)')
    ];

    var r = result(res, [['Decide', 'staff in each half hour'], ['Limit', '≤ 5% hang up, every slot'], ['Goal', 'fewest staff']],
                   '186/190', 'weekday slots within the 5% abandonment cap', 'Orange: slots over the cap');
    var segs = [['Textbook formula', 41, 'bar-u'], ['Certified plan', 186, 'bar-c']].map(function(b){
      var row = h('div', 'res-bar', r.viz);
      h('span', '', row, b[0] + ' · ' + b[1] + '/190');
      var tr = h('span', 'res-track', row);
      return {ok: h('i', b[2], tr), bad: h('i', 'bar-bad', tr), n: b[1]};
    });

    var BEATS = [
      [ACTS[1], 'A textbook plan sizes each slot as if it starts empty. The backlog carries over and hang-ups break the cap.'],
      [CS[0] - .2, 'Certificates test each slot with the callers it inherits, adding staff until hang-ups stay under 5%. ' +
                   clock(worst) + ' needs ' + MY[worst] + '.'],
      [T.ahead, 'Staffing ahead: ' + (AH[early] - MY[early]) + ' more at ' + clock(early) + ' keep pace with the surge, so no backlog forms and ' + clock(late) + ' needs ' +
                (MY[late] - AH[late]) + ' fewer.']
    ];
    function mix(a, b, w){ return w <= 0 ? a : w >= 1 ? b : a.map(function(v, i){ return v + (b[i] - v) * w; }); }
    return {
      acts: ACTS, end: END,
      captions: [
        'Staff is set per half hour, but calls and patience shift, and waiting callers spill into the next slot.',
        BEATS[2][1],
        'At a calibrated hospital contact centre, certified plans keep 186 of 190 weekday slots within the cap, against 41.'
      ],
      captionAt: function(t){
        if (t < ACTS[1] || t >= ACTS[2]) return null;
        for (var i = BEATS.length - 1; i >= 0; i--) if (t >= BEATS[i][0]) return BEATS[i][1];
        return BEATS[0][1];
      },
      render: function(t){
        var out = 1 - p(t, ACTS[1], ACTS[1] + .5), inM = p(t, ACTS[1] + .3, ACTS[1] + .8);
        // the problem
        op(frame, p(t, 0, .5));
        var sw = p(t, .6, 5.2);
        clipR.setAttribute('width', sw * (X1 - X0));
        op(lamT, p(sw, .7, .76)); op(patT, p(sw, .92, 1) * out); op(patL, out);
        boxes.forEach(function(b, k){
          var a = p(sw, k / K, (k + .5) / K);
          op(b, a); op(qs[k], a * (1 - p(t, T.plan, T.plan + .4)));
        });
        arrows.forEach(function(e, k){ op(e, p(sw, (k + 1) / K, (k + 1) / K + .06) * out); });
        op(carT, p(t, 5.8, 6.4) * out); op(marksH, p(t, 7.2, 7.8));
        // the method: (1) the textbook plan plays out, (2) certified slot by slot, (3) staffing ahead
        op(lane2, inM); op(staffT, p(t, T.sweep[0], T.sweep[0] + .5));
        var cur = p(t, T.sweep[0], T.sweep[1]);
        clipM.setAttribute('width', cur * (X1 - X0));
        cursor.setAttribute('x1', x(cur * M)); cursor.setAttribute('x2', x(cur * M));
        op(cursor, cur > 0 && cur < 1 ? 1 : 0);
        var a1 = ease(p(t, T.ahead, T.ahead + .8)), a1q = ease(p(t, T.ahead + .4, T.ahead + 1.4)), a2 = ease(p(t, T.late, T.late + .6));
        var ak = {}; ak[early] = a1; ak[late] = a2;
        var q = W[0];
        EM.forEach(function(n, k){
          var rk = ease(p(t, CS[k], CS[k] + DU[k]));                // this slot's certificate
          if (rk > 0) q = mix(W[k], W[k + 1], rk);
          var shown = p(t, T.plan, T.plan + .4);
          op(ne[k], shown * (1 - rk));
          op(nm[k], rk * (1 - (ak[k] || 0)));
          cls(boxes[k], rk > .5 ? 'slot ours' : 'slot');
          var v = lerp(lerp(n, MY[k], rk), AH[k], ak[k] || 0), hb = v * mu / lmax * (UB - UT);
          bars[k].setAttribute('y', UB - hb); bars[k].setAttribute('height', hb);
          cls(bars[k], rk > .5 ? 'sb ours' : 'sb');
          var tested = cur >= (k + 1) / K, ok = rk > .5 || BE[k] <= cap;
          txt(marks[k], rk > .5 || tested ? (ok ? '✓' : '✗') : '?');
          cls(marks[k], rk > .5 ? 'tick' : !tested ? 'tick gray' : ok ? 'tick gray' : 'tick bad');
          op(marks[k], p(t, 7.4, 7.9));
        });
        if (a1q > 0) q = mix(W[K], W[K + 1], a1q);
        if (a2 > 0) q = mix(W[K + 1], W[K + 2], a2);
        qArea.setAttribute('d', 'M' + x(0) + ' ' + QB + 'L' + poly(q, yq).replace(/ /g, 'L') + 'L' + x(M) + ' ' + QB + 'Z');
        op(worstT, p(cur, (worst + 1) / K, (worst + 1) / K + .03) * (1 - p(t, CS[worst], CS[worst] + .4)));
        op(peakT, p(t, CS[worst] + DU[worst] + .2, CS[worst] + DU[worst] + .7) * (1 - p(t, T.ahead + .4, T.ahead + .9)));
        op(notes[0], p(t, CS[worst], CS[worst] + .5) * (1 - p(t, T.ahead - .4, T.ahead)));
        op(notes[1], p(t, T.ahead, T.ahead + .5)); op(notes[2], p(t, T.late, T.late + .5));
        op(notes[3], p(t, T.total, T.total + .6));
        na.forEach(function(e, i){ op(e, ak[moved[i]]); });
        // the result
        var g = ease(p(t, ACTS[2] + .4, ACTS[2] + 1.9));
        segs.forEach(function(sg){
          sg.ok.style.width = (sg.n / 190 * 100 * g) + '%';
          sg.bad.style.width = ((190 - sg.n) / 190 * 100 * g) + '%';
        });
        op(r.viz, p(t, ACTS[2] + .2, ACTS[2] + .5)); op(r.big, p(t, ACTS[2] + 2, ACTS[2] + 2.5));
        op(r.label, p(t, ACTS[2] + 2, ACTS[2] + 2.5)); op(r.note, p(t, ACTS[2] + 2.8, ACTS[2] + 3.3));
        r.swap(t, [.5, 7.2, 8.2], ACTS[2]);
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
    var api = BUILD[fig.dataset.anim](svg, res), ACT = api.acts, END = api.end;
    var raf = null, t0 = null, act = -1;

    function setAct(i){
      if (i === act) return;
      act = i;
      acts.forEach(function(b, k){ b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      capEl.textContent = api.captions[i];
    }
    function draw(t){
      api.render(t);
      setAct(t >= ACT[2] ? 2 : t >= ACT[1] ? 1 : 0);
      var c = api.captionAt && api.captionAt(t);  // some acts narrate their beats
      txt(capEl, c || api.captions[act]);
    }
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
