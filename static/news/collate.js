openview = (pg => { window.location = location.origin + location.pathname + '?page=' + pg; })
var page;
{
    args = location.search
        .substring(1)
        .split('&')
        .map(v => v.split('=', 2))
        .reduce(((r, v) => ({ [v[0]]: v[1], ...r })), {});
    if (args.page == undefined)
        openview('main');
    page = views[args.page];
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
            typ = 'audio controls'
        } else {
            typ = 'img';
        }
        media = `<${typ} src=${elm.img} />`
    }
    return `
<div class='card' style='background-color: ${sc.color}' onclick='window.open("${elm.piecel}")'>
    <h1>${elm.piece}</h1>
 ` + media + `
    <p>${elm.pieced}</p>
    <p>${pdt}</p>
    <p>${sc.name}</p>
</div>`
}
function petty_nav(vnm, bk) {
    return `
<div class='vw'${bk ? ' id="vws"' : ''} onClick='openview("${vnm}")' >
    <center>
        <h3>${views[vnm].title}</h3>
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
    }
}

async function coll_source(sc) {
    var res = await corsfix.fetch(sc.url, {
        //method: 'POST',
        //body: sc.url,
        cache: 'no-cache',
    });
    res = await res.text();
    res = parse(res);
    res = res.querySelectorAll('item, entry')
        .values()
        .map(info)
        .filter(e => (e.piece != 'No records found'));
    res = deiter(res);
    res = sc.postproc(res);
    res = res.map(e => [e.dt, petty_elm(e, sc)]);
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
    ls.sort().reverse();
    ls = ls.map(v => v[1]);
    //ls = [...new Set(ls)];
    ls = ls.join('');
    return `
<div class='feed'>
    <center><h2 class="feedttl">${feed.title}</h2></center>
` + ls + `
</div>
`
}
async function collect(view) {
    var ls = view.feeds.map(coll_feed);
    ls = await Promise.all(ls);
    return `
<div id='content'>
` + ls.join('') + `
</div>
`
};

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

async function load(view) {
    const body = document.querySelector('body');

    body.innerHTML = `<nav id='chv'>`
        + Object.keys(views)
            .map(key => petty_nav(key, key == page))
            .join('')
        + `</nav>`;
    body.innerHTML += await collect(view);

    var ind = 0
    for (fd of body.querySelectorAll('.feed')) {
        fd.style.flex = view.bkd[ind];
        ind++;
    }

    chop(view.mxlen);
}
window.onload = (() => {
    load(page);
});
