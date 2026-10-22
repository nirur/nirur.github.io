openview = (pg => { window.location = location.origin + location.pathname + '?page=' + pg; })
var rpage, page;
{
    args = location.search
        .substring(1)
        .split('&')
        .map(v => v.split('=', 2))
        .reduce(((r, v) => ({ [v[0]]: v[1], ...r })), {});
    rpage = args.page;
    if (args.page == undefined
        || (rpage != 'about' && !Object.keys(LAYS).includes(rpage)))
        openview(Object.keys(LAYS)[0]);
}

var parse, parseh;
{
    const parser = new DOMParser();
    parse = (txt => parser.parseFromString(txt, 'text/xml'));
    parseh = (txt => parser.parseFromString(txt, 'text/html'));
}
const getr = (e, t) => e.querySelector(t);
const get = (e, t) => getr(e, t)?.textContent;
const deiter = (l => l.reduce((r, v) => [...r, v], []));
const elem = (e => document.createElement(e));

function petty_line(ln) {
    if (ln == undefined || ln == null)
        return '';
    ln = ln.trim();
    if (ln.startsWith('<![CDATA['))
        ln = ln.slice(9, -3);
    ln = ln.trim();
    ln = ln.replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"');
    ln = DOMPurify.sanitize(ln);
    return ln;
}
function gmedia(elm) {
    if (elm.media) {
        var typ;
        if (elm.mediat?.startsWith('audio')) {
            typ = 'audio controls';
        } else {
            typ = 'img';
        }
        return `<${typ} src=${elm.media} loading="lazy"></${typ}>`;
    }
    return '';
}
function petty_elm(elm) {
    var dt = elm.dt;
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    var pad = (n => (n < 10 ? '0' + n : n));
    var pdt = `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} '${dt.getFullYear() % 100}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    var media = gmedia(elm);
    var ret = elem('a');
    ret.classList = 'card';
    ret.style.backgroundColor = elm.color;
    if (elm.piecel)
        ret.href = elm.piecel;
    ret.rel = "noopener noreferrer";
    ret.target = "_blank";
    ret.innerHTML = `
    <div class='t_h'>${elm.piece}</div>
 ` + media + `
    <p>${elm.pieced}</p>
    <p>
` + (elm.auth ? `<span>${elm.auth}</span>` : '') + `
    <span>${pdt}</span>
    <span>${elm.series}</span>
</p>`;
    var fig = ret.querySelector('figure');
    if (fig) {
        fig.replaceWith(fig.firstChild);
    }
    var img = ret.querySelector('img');
    if (img) {
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.removeAttribute('sizes');
    }
    return ret;
}
function petty_nav(name, sel, ttl) {
    return `
<a${sel ? ' id="vws"' : ''} class='hide' href='news?page=${name}' >
    ${ttl}
</a>`;
}

function algo(el, rank) {
    // HIGHER IS BETTER

    //const push = 7_200_000; //86_400_000; // 7_200_000
    //return time - rank * push;

    // Modified Hacker News
    return ((rank + 2) ** -0.5) * (((Date.now() - el.dt.getTime()) / 3_600_000) + 2) ** -el.weight
}

function info(el, sc) {
    var mediap = getr(el, 'enclosure, content');
    if (mediap?.textContent.includes("Terry"))
        mediap = null;
    var ret = {
        piece: petty_line(get(el, 'title')),
        pieced: petty_line(get(el, 'description, encoded, summary')),
        piecel: petty_line(get(el, 'link') || getr(el, 'link')?.getAttribute('href')),
        media: mediap?.getAttribute('url'),
        mediat: (mediap?.getAttribute('type')?.startsWith('audio') ? 'audio' : 'img'),
        dt: new Date(get(el, 'pubDate, updated')),
        guid: petty_line(get(el, 'guid')),
        series: sc.name,
        color: sc.color,
        raw: el,
        weight: sc.gravity,
        auth: el.querySelectorAll('creator').values().map(
            e => petty_line(e.textContent)
        ).join('; '),
    };
    if (sc.name.startsWith('C-SPAN')) {
        ret.piecel = 'https://www.c-span.org/podcasts/subpage/?series='
            + (s => {
                if (s == 'Washington Today')
                    return 'washingtonToday';
                if (s == 'Ceasefire')
                    return 'ceasefire';
                if (s == 'Extreme Mortman')
                    return 'ExtremeMortman';
                throw new Error('You added a C-SPAN podcast without finding the linking series name.');
            })(sc.name.slice(9)) + '&episode=' + ret.guid;
    }
    if (ret.pieced.includes('blockquote'))
        ret.pieced = ret.pieced.slice(0, ret.pieced.indexOf('<blockquote'));
    return ret;
}

var CACHE = {};
async function rote_fetch(url, prx) {
    var res;
    if (prx) {
        res = await fetch('https://cors-proxy.a91-b83.workers.dev/', {
            method: 'POST',
            cache: 'no-cache',
            body: url,
            headers: {},
        });
    } else {
        res = await fetch(url, { cache: 'no-cache' });
    }
    if (res.status != 200)
        return null;
    res = await res.text();
    return res;
}
function cached_fetch(url, prx) {
    if (CACHE[url] == undefined) {
        // no await to ensure no repeats
        CACHE[url] = rote_fetch(url, prx);
    }
    return CACHE[url];
}

async function coll_source(sc, rules = []) {
    rules = [...rules, sc.postproc];
    var res = await cached_fetch(sc.url, sc.proxy);
    if (res == null)
        return [];
    res = parse(res);
    res = res.querySelectorAll('item, entry')
        .values()
        .map(e => info(e, sc))
        .filter(e => (
            (e.piece != 'No records found')
            && (!e.piece.startsWith('Alert Run Date'))
        ));
    res = deiter(res);
    for (var rule of rules) {
        if (rule != undefined)
            res = rule(res);
    }
    return res;
}
async function coll_feed(feed, ELEM, rules = []) {
    rules = [...rules, feed.postproc];
    var sources = feed.sources;
    var ogs = sources.map(sc => (new URL(sc.url)).origin);
    var scs = new Set(ogs);
    var obj = {};
    for (var or of scs)
        obj[or] = [];
    sources.forEach((sc, i) => { obj[ogs[i]].push(sc) });

    var fttl = '';
    if (feed.title)
        fttl = `<div class="feedttl">${feed.title}</div>`;
    ELEM.innerHTML += fttl;

    var added = [];
    Object.values(obj).map(async scg => {
        var ls = scg.map(sc => coll_source(sc, rules));
        ls = await Promise.all(ls);
        ls = ls.filter(l => l.length > 0);
        ls = ls.flatMap(l => l.map((e, r) => [algo(e, r), e]));

        var st = {};
        ls.forEach(v => {
            var key = v[1].guid;
            var value = [v[0], v[1]];
            if (st[key] == undefined) {
                st[key] = value;
            } else {
                st[key][0] += value[0];
            }
        });

        ls = Object.values(st);
        ls.sort();
        ls.reverse();
        ls = ls.map((e, r) => {
            e = e[1];
            e.weight = GRAV;
            return [algo(e, r), e];
        });
        ls.sort();
        ls.reverse();
        ls = ls.map(v => [v[0], petty_elm(v[1])]);

        // crude chop:
        if (ls.length == 0)
            return;

        ist = (i, j) => {
            ELEM.insertBefore(ls[j][1], added[i][1]);
            added.splice(i, 0, ls[j]);
        }
        var j = 0;
        for (var i = 0; i < added.length; i++) // don't simplify line
            if (added[i][0] < ls[j][0]) {
                ist(i, j);
                j++;
                if (j >= ls.length)
                    break;
            }
        for (var k = j; k < ls.length; k++) { // not simplifiable
            ELEM.appendChild(ls[k][1]);
            added.push(ls[k]);
        }
    });
}
async function coll_view(view, ns = [], ELEM, rules = []) {
    rules = [...rules, view.postproc];
    var ret = elem('div');
    ret.classList = 'view';
    ns.forEach(n => ret.classList.add(`scrn${n}`));
    ELEM.appendChild(ret);

    await Promise.all(view.feeds.map((e, i) => {
        var fd = elem('div');
        fd.classList = 'feed';
        fd.style.flex = view.bkd[i];
        ret.appendChild(fd);
        return coll_feed(e, fd, rules);
    }));
}
async function collect(lay, ELEM) {
    var views = lay.views;
    var clss = [];
    var i = VMAX;
    for (var j in views) {
        var ln = views[j].feeds.length;
        ln = (ln <= VMAX ? ln : VMAX);
        var ls = [];
        for (; i >= ln; i--)
            ls.push(i);
        clss.push(ls);
    }

    var rules = [POSTPROC, lay.postproc];
    views.forEach((v, i) => coll_view(v, clss[i], ELEM, rules));
}

window.onload = (() => {
    document.querySelector('#chv').innerHTML +=
        Object.keys(LAYS)
            .map(key => petty_nav(key, key == rpage, LAYS[key].title))
            .join('')
        + petty_nav('about', rpage == 'about', 'About')
        + `</nav>`;
    if (rpage == 'about') {
        document.querySelector('#about').hidden = false;
    } else {
        page = LAYS[args.page];
        const tba = document.querySelector('#content');
        collect(page, tba);
    }
});
