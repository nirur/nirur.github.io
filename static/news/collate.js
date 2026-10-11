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
    ln = ln.replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');
    ln = DOMPurify.sanitize(ln);
    return ln;
}
function petty_elm(elm) {
    var dt = elm.dt;
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    var pad = (n => (n < 10 ? '0' + n : n));
    var pdt = `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} '${dt.getFullYear() % 100}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    var media = '';
    if (elm.media) {
        var typ;
        if (elm.mediat?.startsWith('audio')) {
            typ = 'audio controls';
        } else {
            typ = 'img';
        }
        media = `<${typ} src=${elm.media} loading="lazy"></${typ}>`;
    }
    var ret = elem('div');
    ret.classList = 'card';
    ret.style.backgroundColor = elm.color;
    ret.onclick = (() => window.open(elm.piecel));
    ret.innerHTML = `
    <div class='t_h'>${elm.piece}</div>
 ` + media + `
    <p>${elm.pieced}</p>
    <p>${pdt}</p>
    <p>${elm.series}</p>
`;
    return ret;
}
function petty_nav(name, sel, ttl) {
    return `
<span${sel ? ' id="vws"' : ''} class='hide' onClick='openview("${name}")' >
    ${ttl}
</span>`;
}

function algo(time, rank) {
    // HIGHER IS BETTER

    const push = 86_400_000; // 7_200_000
    return time - rank * push;

    // Modified Hacker News
    // return (1 / (rank + 2)) * ((Date.now() - time) / 3_600_000 + 2) ** -1.8
}

function info(el, sc) {
    var mediap = getr(el, 'enclosure, content');
    if (mediap?.textContent.includes("Terry"))
        mediap = null;
    return {
        piece: petty_line(get(el, 'title')),
        pieced: petty_line(get(el, 'description, encoded, summary')),
        piecel: petty_line(get(el, 'link') || getr(el, 'link')?.getAttribute('href')),
        media: mediap?.getAttribute('url'),
        mediat: (mediap?.getAttribute('type')?.startsWith('audio') ? 'audio' : 'img'),
        dt: new Date(get(el, 'pubDate, updated')),
        guid: get(el, 'guid'),
        series: sc.name,
        color: sc.color,
        raw: el,
    }
}

var CACHE = {};
async function rote_fetch(url) {
    var res = await fetch('https://cors-proxy.a91-b83.workers.dev/', {
        method: 'POST',
        cache: 'no-cache',
        body: url,
    });
    if (res.status != 200)
        return null;
    res = await res.text();
    return res;
}
function cached_fetch(url) {
    if (CACHE[url] == undefined) {
        // no await to ensure no repeats
        CACHE[url] = rote_fetch(url);
    }
    return CACHE[url];
}

async function coll_source(sc, rules = []) {
    rules = [...rules, sc.postproc];
    var res = await cached_fetch(sc.url);
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
    res = res.map(e => [e.dt.getTime(), e.guid, petty_elm(e)]);
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
        ls = ls.flatMap(l =>
            l.map((e, r) =>
                [algo(e[0], r), e]
            )
        );
        ls.sort();

        var st = new Set();
        var ls_red = [];
        ls.forEach(v => {
            if (!st.has(v[1][1])) {
                st.add(v[1][1]);
                ls_red.push([v[1][0], v[1][2]]);
            }
        });
        ls_red.reverse();
        ls = ls_red.map((e, r) => [algo(e[0], r), e[1]]);
        ls.sort();
        ls.reverse();

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
