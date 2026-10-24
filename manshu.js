(function () {
  var PUB = location.hostname.indexOf('github.io') >= 0 || location.search.indexOf('pub=1') >= 0;
  var LINKOUT_PUBLIC = false;
  var STAFF_HASH = '8da9f6b2c40e4b040c83aaab14cfec8c3ac3fc4e56b677ca4056246aa1fd467a';
  var staff = false;
  try { staff = parseInt(localStorage.getItem('jiro_staff') || '0', 10) > Date.now(); } catch (e) {}
  var AUTOCLOSE = 0;
  var CODE = {'桐生':'01kiryu','戸田':'02toda','江戸川':'03edogawa','平和島':'04heiwajima','多摩川':'05tamagawa','浜名湖':'06hamanako','蒲郡':'07gamagori','常滑':'08tokoname','津':'09tsu','三国':'10mikuni','びわこ':'11biwako','住之江':'12suminoe','尼崎':'13amagasaki','鳴門':'14naruto','丸亀':'15marugame','児島':'16kojima','宮島':'17miyajima','徳山':'18tokuyama','下関':'19shimonoseki','若松':'20wakamatsu','芦屋':'21ashiya','福岡':'22fukuoka','唐津':'23karatsu','大村':'24omura'};
  var sel = document.getElementById('d'), box = document.getElementById('list'), sum = document.getElementById('sum');
  var pl = document.getElementById('pl'), pt = document.getElementById('pt');
  var timer = null;
  document.getElementById('m10').style.display = 'none';
  document.getElementById('p10').style.display = 'none';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fmt(d) { return d.slice(0,4) + '/' + d.slice(4,6) + '/' + d.slice(6,8); }
  function closeP() {
    clearTimeout(timer);
    var o = document.getElementById('fr'); if (o) o.remove();
    pl.hidden = true;
  }
  function play(url, name, sec) {
    clearTimeout(timer);
    var o = document.getElementById('fr'); if (o) o.remove();
    var f = document.createElement('iframe');
    f.id = 'fr';
    f.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
    f.setAttribute('allowfullscreen', '');
    f.src = url;
    pl.insertBefore(f, pl.querySelector('.pb'));
    pt.textContent = name;
    pl.hidden = false;
    pl.scrollIntoView({block: 'start', behavior: 'smooth'});
    var ac = sec || AUTOCLOSE;
    if (ac > 0) timer = setTimeout(closeP, ac * 1000);
  }
  box.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-u]');
    if (b) play(b.getAttribute('data-u'), b.getAttribute('data-n'), parseInt(b.getAttribute('data-s') || '0', 10));
  });
  document.getElementById('cl').onclick = closeP;
  function stats(d) {
    var el = document.getElementById('pbs');
    if (!el) { el = document.createElement('div'); el.id = 'pbs'; el.style.cssText = 'margin:8px 0;padding:8px 12px;background:#f3f4f6;border-radius:8px;font-size:14px;line-height:1.7'; box.parentNode.insertBefore(el, box); }
    el.textContent = '成績を計算中…';
    fetch('days/' + d + '.json?' + Date.now(), {cache: 'no-store'}).then(function (r) { return r.json(); }).then(function (j) {
      var rs = Array.isArray(j) ? j : (j.races || []), n = 0, s1 = 0, r1 = 0, s2 = 0, r2 = 0;
      rs.forEach(function (x) {
        if (!x.res || !x.od || !x.od.pk) return;
        var p = x.ex ? x.ex : x.pre; if (!p || !p.picks) return;
        var pays = x.res.pays || {}, inv = [], i, ok = true;
        for (i = 0; i < p.picks.length; i++) { var o = x.od.pk[p.picks[i]]; if (!o || o <= 0) { ok = false; break; } inv.push(1 / o); }
        if (!ok) return;
        var t = 0, raw = [], base = [], used = 0, idx = [];
        for (i = 0; i < inv.length; i++) t += inv[i];
        for (i = 0; i < inv.length; i++) { raw.push(50 * inv[i] / t); base.push(Math.floor(raw[i])); used += base[i]; idx.push(i); }
        idx.sort(function (a, b) { return (raw[b] - base[b]) - (raw[a] - base[a]); });
        for (i = 0; i < 50 - used; i++) base[idx[i]]++;
        var g1 = 0, g2 = 0;
        for (i = 0; i < p.picks.length; i++) { var pay = pays[p.picks[i]] || 0; g1 += pay; g2 += base[i] * pay; }
        n++; s1 += 100 * p.picks.length; r1 += g1; s2 += 5000; r2 += g2;
      });
      function f(v) { return (v >= 0 ? '+' : '') + Math.round(v).toLocaleString() + '円'; }
      el.innerHTML = n ? '<b>この日の成績（スタッフ用）</b><br>100円ずつ買い 回収率 <b>' + Math.round(100 * r1 / s1) + '%</b>（' + f(r1 - s1) + '）／ 合成オッズ5000円買い 回収率 <b>' + Math.round(100 * r2 / s2) + '%</b>（' + f(r2 - s2) + '）<small>（オッズのあるレース ' + n + 'R）</small>' : '<span class="m">この日の成績データはありません。</span>';
    }).catch(function () { el.innerHTML = '<span class="m">成績データを読み込めませんでした。</span>'; });
  }
  function show(d) {
    box.innerHTML = '読み込み中…'; stats(d);
    fetch('manshu/' + d + '.json?' + Date.now()).then(function (r) { return r.json(); }).then(function (j) {
      var rs = j.races || [];
      sum.textContent = rs.length + '本';
      if (!rs.length) { box.innerHTML = '<p class="m">この日の万舟はありません。</p>'; return; }
      box.innerHTML = rs.map(function (x) {
        var code = PUB ? null : CODE[x.stad];
        var link = PUB ? '' : '<span class="m">リプレイなし</span>';
        if (code) {
          var u = 'https://front.player.boatrace-cdn.jp/player/vod?service=boatcast&stadium=' + code + '&raceType=race&raceDate=' + d + '&raceNumber=' + x.r + '&autoplay=1&bitrate=low';
          link = '<button data-u="' + esc(u) + '" data-n="' + esc(x.stad + ' ' + x.r + 'R　' + x.order + '　' + Number(x.pay).toLocaleString() + '円') + '">▶ リプレイ</button>';
        }
        var cd = CODE[x.stad];
        if (cd && (!PUB || LINKOUT_PUBLIC || staff)) link += ' <a class="m" href="https://race.boatcast.jp/replay?jo=' + cd.slice(0, 2) + '&ymd=' + d + '&race=' + x.r + '&md=V" target="_blank" rel="noopener">BOATCASTで開く</a>';
        if (false && x.url) link += ' <a class="m" href="' + esc(x.url) + '" target="_blank" rel="noopener">YouTube</a>';
        if (PUB && !staff) link = '';
        if (false) {
          var ym = x.url.match(/v=([A-Za-z0-9_-]+)&t=(\d+)s/);
          if (ym) link = '<button data-s="150" data-u="' + esc('https://www.youtube.com/embed/' + ym[1] + '?start=' + ym[2] + '&autoplay=1&rel=0&playsinline=1') + '" data-n="' + esc(x.stad + ' ' + x.r + 'R　' + x.order + '　' + Number(x.pay).toLocaleString() + '円') + '">▶ 動画（スタッフ）</button> ' + link;
        }
        return '<div class="c"><div class="h"><b>' + esc(x.stad) + ' ' + x.r + 'R</b><span class="m"> 締切 ' + esc(x.close) + '</span></div>' +
          '<div class="p">' + esc(x.order) + ' <b>' + Number(x.pay).toLocaleString() + '円</b></div><div>' + link + '</div></div>';
      }).join('');
    }).catch(function () { box.innerHTML = '<p class="m">データがありません。</p>'; });
  }
  if (PUB) {
    var sb = document.createElement('button');
    sb.id = 'stf';
    var lab = function () { sb.textContent = staff ? 'スタッフ用（解除）' : 'スタッフ用'; };
    lab();
    document.querySelector('.bar').appendChild(sb);
    sb.onclick = function () {
      if (staff) { staff = false; try { localStorage.removeItem('jiro_staff'); } catch (e) {} lab(); closeP(); show(sel.value); return; }
      var v = window.prompt('合言葉');
      if (!v) return;
      if (!STAFF_HASH) { window.alert('合言葉が未設定です'); return; }
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function (b) {
        var h = Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
        if (h === STAFF_HASH) { staff = true; try { localStorage.setItem('jiro_staff', String(Date.now() + 12 * 3600 * 1000)); } catch (e) {} lab(); show(sel.value); }
        else window.alert('合言葉が違います');
      });
    };
  }
  if (PUB && !staff) {
    if (typeof sb !== 'undefined') sb.style.display = 'none';
    document.querySelector('.bar').style.display = 'none';
    box.innerHTML = '<div class="c"><p>スタッフ用のページです。合言葉を入力してください。</p><p><input type="password" id="pw" autocomplete="off"> <button id="go">開く</button></p><p class="m" id="er"></p></div>';
    var tryPw = function () {
      var v = document.getElementById('pw').value;
      var er = document.getElementById('er');
      if (!v) return;
      if (!STAFF_HASH) { er.textContent = '合言葉が未設定です'; return; }
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function (b) {
        var h = Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
        if (h === STAFF_HASH) {
          try { localStorage.setItem('jiro_staff', String(Date.now() + 12 * 3600 * 1000)); } catch (e) {}
          location.reload();
        } else { er.textContent = '合言葉が違います'; }
      });
    };
    document.getElementById('go').onclick = tryPw;
    document.getElementById('pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPw(); });
    return;
  }
  fetch('manshu/index.json?' + Date.now()).then(function (r) { return r.json(); }).then(function (ds) {
    ds = ds.slice().reverse();
    sel.innerHTML = ds.map(function (d) { return '<option value="' + d + '">' + fmt(d) + '</option>'; }).join('');
    sel.onchange = function () { show(sel.value); };
    document.getElementById('prev').onclick = function () { if (sel.selectedIndex < ds.length - 1) { sel.selectedIndex++; sel.onchange(); } };
    document.getElementById('next').onclick = function () { if (sel.selectedIndex > 0) { sel.selectedIndex--; sel.onchange(); } };
    if (ds.length) show(ds[0]); else box.innerHTML = '<p class="m">まだデータがありません。</p>';
  }).catch(function () { box.innerHTML = '<p class="m">データがありません。</p>'; });
})();
