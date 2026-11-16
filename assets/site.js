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


    function setupCharts() {
        var hosts = document.querySelectorAll('.chart[data-chart]');
        if (!hosts.length) { return; }
        var ns = 'http://www.w3.org/2000/svg';

        function el(name, attrs, parent) {
            var node = document.createElementNS(ns, name);
            Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
            if (parent) { parent.appendChild(node); }
            return node;
        }
        function niceMax(v) {
            var exp = Math.pow(10, Math.floor(Math.log(v) / Math.LN10));
            var f = v / exp;
            var step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
            return step * exp;
        }
        function label(parent, x, y, str, anchor, size, fill) {
            var t = el('text', { x: x, y: y, 'text-anchor': anchor, 'font-family': 'IBM Plex Mono, Menlo, monospace', 'font-size': size, fill: fill }, parent);
            t.textContent = str;
            return t;
        }

        hosts.forEach(function (host) {
            var cfg = JSON.parse(host.getAttribute('data-chart'));
            var W = 720, H = 300, L = 46, R = 14, T = 12, B = 30;
            var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.alt });
            var n = cfg.labels.length;
            var max = 0;
            if (cfg.type === 'stacked') {
                for (var i = 0; i < n; i += 1) {
                    var tot = 0;
                    cfg.series.forEach(function (sr) { tot += sr.data[i] || 0; });
                    max = Math.max(max, tot);
                }
            } else {
                cfg.series.forEach(function (sr) { sr.data.forEach(function (v) { if (v !== null) { max = Math.max(max, v); } }); });
            }
            var top = niceMax(max * 1.04);
            var plotW = W - L - R, plotH = H - T - B;
            function y(v) { return T + plotH - (v / top) * plotH; }
            var ticks = 5, k;
            for (k = 0; k <= ticks; k += 1) {
                var tv = top * k / ticks;
                el('line', { x1: L, x2: W - R, y1: y(tv), y2: y(tv), stroke: k === 0 ? '#111c26' : '#dde2e8' }, svg);
                label(svg, L - 6, y(tv) + 4, String(Math.round(tv * 10) / 10), 'end', 11, '#55616d');
            }
            var step = plotW / n;
            cfg.labels.forEach(function (lb, i) {
                var cx = L + step * i + step / 2;
                label(svg, cx, H - 10, String(lb), 'middle', 11, '#55616d');
            });
            if (cfg.type === 'stacked') {
                var bw = Math.min(40, step * 0.7);
                for (var j = 0; j < n; j += 1) {
                    var acc = 0;
                    cfg.series.forEach(function (sr) {
                        var v = sr.data[j] || 0;
                        if (v > 0) {
                            var x0 = L + step * j + (step - bw) / 2;
                            var r = el('rect', { x: x0, y: y(acc + v), width: bw, height: y(acc) - y(acc + v), fill: sr.color }, svg);
                            el('title', {}, r).textContent = cfg.labels[j] + ' · ' + sr.name + ': ' + v + ' ' + cfg.unit;
                        }
                        acc += v;
                    });
                }
            } else {
                cfg.series.forEach(function (sr) {
                    var d = '', started = false, last = null;
                    sr.data.forEach(function (v, i) {
                        if (v === null) { return; }
                        var px = L + step * i + step / 2;
                        d += (started ? 'L' : 'M') + px.toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
                        started = true;
                        last = { x: px, y: y(v), v: v };
                    });
                    el('path', { d: d, fill: 'none', stroke: sr.color, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, svg);
                    sr.data.forEach(function (v, i) {
                        if (v === null) { return; }
                        var c = el('circle', { cx: L + step * i + step / 2, cy: y(v), r: 3.4, fill: sr.color }, svg);
                        el('title', {}, c).textContent = cfg.labels[i] + ' · ' + sr.name + ': ' + v + ' ' + cfg.unit;
                    });
                    if (last) { label(svg, last.x, last.y - 9, String(last.v), 'middle', 11.5, sr.color); }
                });
            }
            label(svg, L, T - 1, cfg.unit, 'start', 11, '#55616d').setAttribute('dy', '-1');
            host.appendChild(svg);
            var legend = document.createElement('div');
            legend.className = 'legend-inline';
            cfg.series.forEach(function (sr) {
                var item = document.createElement('span');
                var sw = document.createElement('i');
                sw.style.background = sr.color;
                item.appendChild(sw);
                item.appendChild(document.createTextNode(sr.name));
                legend.appendChild(item);
            });
            host.appendChild(legend);
        });
    }

    ready(function () {
        setupReveal();
        setupLightbox();
        setupPubChart();
        setupCharts();
    });
}());
