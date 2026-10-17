(function () {
  var sel = document.getElementById('d'), box = document.getElementById('list'), sum = document.getElementById('sum');
  var pl = document.getElementById('pl'), fr = document.getElementById('fr'), pt = document.getElementById('pt');
  var cur = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fmt(d) { return d.slice(0,4) + '/' + d.slice(4,6) + '/' + d.slice(6,8); }
  function hms(t) { var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return (h ? h + ':' + String(m).padStart(2,'0') : m) + ':' + String(s).padStart(2,'0'); }
  var GOAL = 135, yt = null, timer = null;
  function closeP() {
    clearInterval(timer);
    try { if (yt) yt.destroy(); } catch (e) {}
    yt = null;
    var o = document.getElementById('fr'); if (o) o.remove();
    pl.hidden = true; cur = null;
  }
  function loadApi(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    window.onYouTubeIframeAPIReady = cb;
    var sc = document.createElement('script');
    sc.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(sc);
  }
  function play() {
    if (!cur) return;
    clearInterval(timer);
    try { if (yt) yt.destroy(); } catch (e) {}
    yt = null;
    var o = document.getElementById('fr'); if (o) o.remove();
    var d = document.createElement('div'); d.id = 'fr';
    pl.insertBefore(d, pl.querySelector('.pb'));
    var c = cur;
    pt.textContent = c.name + '（再生開始 ' + hms(c.t) + '・ゴールで自動で閉じます）';
    pl.hidden = false;
    pl.scrollIntoView({block: 'start', behavior: 'smooth'});
    loadApi(function () {
      yt = new YT.Player('fr', {width: '100%', height: '100%', videoId: c.v,
        playerVars: {start: c.t, autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1},
        events: {
          onReady: function (e) { e.target.playVideo(); },
          onError: function (e) { pt.textContent = c.name + '　※この動画はここで再生できません（エラー' + e.data + '）。「YouTubeで開く」を使ってください'; }
        }});
      timer = setInterval(function () { try { if (yt.getCurrentTime() >= c.end) closeP(); } catch (e) {} }, 1000);
    });
  }
  box.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]');
    if (!b) return;
    cur = {v: b.getAttribute('data-v'), t: parseInt(b.getAttribute('data-t'), 10), name: b.getAttribute('data-n')}; cur.end = cur.t + GOAL;
    play();
  });
  document.getElementById('cl').onclick = closeP;
  document.getElementById('m10').onclick = function () { if (cur) { cur.t = Math.max(0, cur.t - 10); play(); } };
  document.getElementById('p10').onclick = function () { if (cur) { cur.t += 10; play(); } };
  function show(d) {
    box.innerHTML = '読み込み中…';
    fetch('manshu/' + d + '.json?' + Date.now()).then(function (r) { return r.json(); }).then(function (j) {
      var rs = j.races || [];
      sum.textContent = rs.length + '本';
      if (!rs.length) { box.innerHTML = '<p class="m">この日の万舟はありません。</p>'; return; }
      box.innerHTML = rs.map(function (x) {
        var link = '<span class="m">無料ライブ配信なし</span>';
        var mm = x.url ? x.url.match(/v=([A-Za-z0-9_-]+)&t=(\d+)s/) : null;
        if (mm) {
          link = '<button data-v="' + mm[1] + '" data-t="' + mm[2] + '" data-n="' + esc(x.stad + ' ' + x.r + 'R　' + x.order + '　' + Number(x.pay).toLocaleString() + '円') + '">▶ ここで再生</button> ' +
            '<a class="m" href="' + esc(x.url) + '" target="_blank" rel="noopener">YouTubeで開く</a>' + (x.note === '推定' ? '<span class="m"> 時刻は推定</span>' : '');
        }
        return '<div class="c"><div class="h"><b>' + esc(x.stad) + ' ' + x.r + 'R</b><span class="m"> 締切 ' + esc(x.close) + '</span></div>' +
          '<div class="p">' + esc(x.order) + ' <b>' + Number(x.pay).toLocaleString() + '円</b></div><div>' + link + '</div></div>';
      }).join('');
    }).catch(function () { box.innerHTML = '<p class="m">データがありません。</p>'; });
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
