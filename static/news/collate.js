const LIM = 40;

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
const sleep = ms => new Promise(r => setTimeout(r, ms)); // https://stackoverflow.com/a/39914235

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
function petty_elm(elm, sc) {
    var dt = elm.dt;
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    var pad = (n => (n < 10 ? '0' + n : n));
    var pdt = `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} '${dt.getFullYear() % 100}, ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    var media = '';
    if (elm.img) {
        var typ;
        if (elm.imgt?.startsWith('audio')) {
            typ = 'audio controls';
        } else {
            typ = 'img';
        }
        media = `<${typ} src=${elm.img}></${typ}>`;
    }
    return `
<div class='card' style='background-color: ${sc.color}' onclick='window.open("${elm.piecel}")'>
    <h1>${elm.piece}</h1>
 ` + media + `
    <p>${elm.pieced}</p>
    <p>${pdt}</p>
    <p>${sc.name}</p>
</div>`;
}
function petty_nav(name, sel, ttl) {
    return `
<div${sel ? ' id="vws"' : ''} class='hide' onClick='openview("${name}")' >
    <center>
        <h3>${ttl}</h3>
    </center>
</div>`;
}

function info(el) {
    var imgp = getr(el, 'enclosure, content');
    if (imgp?.textContent.includes("Terry"))
        imgp = null;
    return {
        piece: petty_line(get(el, 'title')),
        pieced: petty_line(get(el, 'description, content, summary')),
        piecel: petty_line(get(el, 'link') || getr(el, 'link')?.getAttribute('href')),
        img: imgp?.getAttribute('url'),
        imgt: imgp?.getAttribute('type'),
        dt: new Date(get(el, 'pubDate, updated')),
        guid: get(el, 'guid'),
    }
}

var CACHE = {};
async function cached_fetch(url) {
    if (CACHE[url] != undefined)
        return cache[url];
    try {
        CACHE[url] = await fetch(
            'https://cloudflare-cors-anywhere.a91-b83.workers.dev/?' + url,
            { cache: 'no-cache' },
        );
    } catch (e) {
        CACHE[url] = null;
    }
    return CACHE[url];
}

async function coll_source(sc) {
    var res = await cached_fetch(sc.url);
    if (res == null)
        return [];
    res = await res.text();
    res = parse(res);
    res = res.querySelectorAll('item, entry')
        .values()
        .map(info)
        .filter(e => (
            (e.piece != 'No records found')
            && (!e.piece.startsWith('Alert Run Date'))
        ));
    res = deiter(res);
    res = sc.postproc(res);
    res = res.map(e => [e.dt, e.guid, petty_elm(e, sc)]);
    return res;
}
async function coll_feed(feed) {
    var ls = feed.sources.map(coll_source);
    ls = await Promise.all(ls);
    ls = ls.filter(l => l.length > 0);
    ls = ls.flatMap(l =>
        l.entries()
            .map(e => [e[1][0].getTime() - e[0] * 7_200_000, e[1][1]])
            .reduce((r, v) => [...r, v], [])
    );
    ls.sort();

    var st = new Set();
    ls_red = [];
    ls.forEach(v => {
        if (!st.has(v[1])) {
            st.add(v[1]);
            ls_red.push(v[2]);
        }
    });

    ls.reverse();
    ls = ls.slice(0, Math.min(ls.length, LIM));
    ls = ls.map(v => v[1]);

    var fttl = '';
    if (feed.title)
        fttl = `<center><h2 class="feedttl">${feed.title}</h2></center>`;
    return `<div class='feed'>` + fttl + ls_red.join('') + `</div>`;
}
async function coll_view(view, ns = []) {
    var ls = view.feeds.map(coll_feed);
    var ret = elem('div');
    ret.classList = 'view';
    ns.forEach(n => ret.classList.add(`scrn${n}`));
    ls = await Promise.all(ls);
    ret.innerHTML = ls.join('');
    ret.querySelectorAll('.feed').forEach((f, i) => {
        f.style.flex = view.bkd[i];
    });
    return ret;
}
async function collect(lay) {
    var views = lay.views;
    var clss = [];
    var i = 3;
    for (var j in views) {
        var ln = views[j].feeds.length;
        var ls = [];
        for (; i >= ln; i--)
            ls.push(i);
        clss.push(ls);
    }

    var vws = views.map((v, i) => coll_view(v, clss[i])); // wrong
    vws = await Promise.all(vws);
    vws = vws.map(v => v.outerHTML).join('')
    return vws;
}

async function chop(l) {
    var imgs = document.querySelectorAll('img').values();
    var togo = true;
    while (togo) {
        togo = false;
        for (var img of imgs)
            if (!(img.complete && img.naturalWidth > 0))
                togo = true;
        await sleep(5);
    }

    var cards = document.querySelectorAll('.card');
    cards = deiter(cards.values());
    cards = cards.reverse();
    cards.forEach(c => {
        c.hidden = (c.getBoundingClientRect().bottom + window.scrollY > l);
    });
}

async function load(lay) {
    const tba = document.querySelector('#content');
    tba.innerHTML += await collect(lay);
    //chop(view.mxlen);
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
        load(page);
    }
});
