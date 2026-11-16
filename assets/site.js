// Shared behaviour: reveal on scroll, image lightbox, publications-per-year chart.
(function () {
    'use strict';
    document.documentElement.classList.add('js');

    function ready(fn) {
        if (document.readyState !== 'loading') { fn(); } else { document.addEventListener('DOMContentLoaded', fn); }
    }

    function setupReveal() {
        var items = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        items.forEach(function (el) { observer.observe(el); });
    }

    function setupLightbox() {
        var links = document.querySelectorAll('a.zoom, .photo-card a');
        if (!links.length) { return; }
        var box = document.createElement('div');
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Enlarged image');
        var img = document.createElement('img');
        var close = document.createElement('button');
        close.type = 'button';
        close.textContent = 'Close ✕';
        box.appendChild(img);
        box.appendChild(close);
        document.body.appendChild(box);
        var lastFocus = null;

        function shut() {
            box.classList.remove('open');
            img.removeAttribute('src');
            if (lastFocus) { lastFocus.focus(); }
        }
        box.addEventListener('click', shut);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && box.classList.contains('open')) { shut(); }
        });
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var inner = link.querySelector('img');
                img.src = link.getAttribute('href');
                img.alt = inner ? inner.alt : '';
                lastFocus = link;
                box.classList.add('open');
                close.focus();
            });
        });
    }

    function setupPubChart() {
        var host = document.getElementById('pub-chart');
        if (!host) { return; }
        var counts = {};
        document.querySelectorAll('.pub-item[data-year]').forEach(function (el) {
            var y = parseInt(el.getAttribute('data-year'), 10);
            var kind = el.getAttribute('data-kind') === 'conference' ? 'c' : 'j';
            if (!counts[y]) { counts[y] = { j: 0, c: 0 }; }
            counts[y][kind] += 1;
        });
        var years = Object.keys(counts).map(Number);
        if (!years.length) { return; }
        var first = Math.min.apply(null, years);
        var last = Math.max.apply(null, years);
        var max = 0;
        var y;
        for (y = first; y <= last; y += 1) {
            if (counts[y]) { max = Math.max(max, counts[y].j + counts[y].c); }
        }
        var W = 720, H = 190, padL = 8, padB = 26, padT = 18;
        var n = last - first + 1;
        var step = (W - padL * 2) / n;
        var barW = Math.min(34, step * 0.62);
        var unit = (H - padB - padT) / max;
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('role', 'img');
        var summary = [];

        function rect(x, top, h, fill) {
            var r = document.createElementNS(ns, 'rect');
            r.setAttribute('x', x); r.setAttribute('y', top);
            r.setAttribute('width', barW); r.setAttribute('height', h);
            r.setAttribute('fill', fill);
            svg.appendChild(r);
        }
        function text(x, yy, str, size, fill) {
            var t = document.createElementNS(ns, 'text');
            t.setAttribute('x', x); t.setAttribute('y', yy);
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-family', 'IBM Plex Mono, Menlo, monospace');
            t.setAttribute('font-size', size);
            t.setAttribute('fill', fill);
            t.textContent = str;
            svg.appendChild(t);
        }
        var base = H - padB;
        var line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', padL); line.setAttribute('x2', W - padL);
        line.setAttribute('y1', base); line.setAttribute('y2', base);
        line.setAttribute('stroke', '#13212b');
        svg.appendChild(line);

        for (y = first; y <= last; y += 1) {
            var c = counts[y] || { j: 0, c: 0 };
            var cx = padL + step * (y - first) + step / 2;
            var x = cx - barW / 2;
            var hj = c.j * unit, hc = c.c * unit;
            if (c.j) { rect(x, base - hj, hj, '#13212b'); }
            if (c.c) { rect(x, base - hj - hc, hc, '#c4501a'); }
            if (c.j + c.c) {
                text(cx, base - hj - hc - 6, String(c.j + c.c), 12, '#13212b');
                summary.push(y + ': ' + (c.j + c.c));
            }
            text(cx, H - 8, String(y), 11, '#56636d');
        }
        svg.setAttribute('aria-label', 'Publications per year. ' + summary.join(', ') + '.');
        host.insertBefore(svg, host.firstChild);
        host.hidden = false;
    }

    ready(function () {
        setupReveal();
        setupLightbox();
        setupPubChart();
    });
}());
