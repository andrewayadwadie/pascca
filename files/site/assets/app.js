/* PASCCA — shared behaviour. Demo build: all data is static.
   In production these interactions call /api/v1 endpoints. */

(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* sticky nav */
  var nav = $('#nv');
  if (nav) {
    addEventListener('scroll', function () { nav.classList.toggle('small', scrollY > 60); });
  }

  /* mobile overlay */
  var ov = $('#ov');
  if (ov) {
    var open = function () { ov.classList.add('on'); document.body.style.overflow = 'hidden'; };
    var close = function () { ov.classList.remove('on'); document.body.style.overflow = ''; };
    if ($('#bg')) $('#bg').onclick = open;
    if ($('#cx')) $('#cx').onclick = close;
    $$('a', ov).forEach(function (a) { a.onclick = close; });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* scroll reveal */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $$('.rv, .stagger').forEach(function (e) { io.observe(e); });

  /* accordion — one open at a time */
  $$('.q > button').forEach(function (b) {
    b.onclick = function () {
      var q = b.parentElement, wasOpen = q.classList.contains('on');
      $$('.q', q.parentElement).forEach(function (x) { x.classList.remove('on'); });
      if (!wasOpen) q.classList.add('on');
    };
  });

  /* menu filters */
  var filters = $('#filters');
  if (filters) {
    var rows = $$('[data-cat]');
    filters.onclick = function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', filters).forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.dataset.filter;
      rows.forEach(function (r) {
        var show = f === 'all'
          ? true
          : (f === 'fasting' ? r.dataset.fasting === '1'
            : (f === 'veg' ? r.dataset.veg === '1' : r.dataset.cat === f));
        r.style.display = show ? '' : 'none';
      });
      $$('[data-group]').forEach(function (g) {
        var visible = $$('[data-cat]', g).some(function (r) { return r.style.display !== 'none'; });
        g.style.display = visible ? '' : 'none';
      });
    };
  }

  /* reservation / contact form — demo only */
  var sb = $('#submit');
  if (sb) {
    sb.onclick = function () {
      var name = $('#f-name') ? $('#f-name').value.trim() : '';
      var phone = $('#f-phone') ? $('#f-phone').value.trim() : '';
      var box = $('#result');
      box.className = 'ok show';
      if (!name || !phone) {
        box.innerHTML = 'Please add your name and mobile number so we can confirm.';
        return;
      }
      var size = $('#f-size') ? parseInt($('#f-size').value, 10) : 2;
      var ref = 'PSC-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      box.innerHTML = size > 6
        ? 'Thank you, ' + name + ' — request <b>' + ref + '</b> is with our team. Because your party is over six, a member of staff will call you to confirm.'
        : 'Thank you, ' + name + ' — your table is held under <b>' + ref + '</b>. A confirmation email is on its way.';
      box.innerHTML += '<br><span style="opacity:.5;font-size:12px">Preview only — live bookings connect to the backend and dashboard.</span>';
    };
  }

  /* default the date field to tomorrow */
  var d = $('#f-date');
  if (d) { var t = new Date(); t.setDate(t.getDate() + 1); d.value = t.toISOString().slice(0, 10); }

  /* mark current nav item */
  var page = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-l a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
  });
})();
