const VMAX = 4;
const POSTPROC = (l => l.slice(0, Math.min(l.length, 20)));
const GRAV = 0.4;

class Source {
    gravity = GRAV;
    constructor(url, name, color) {
        this.url = url;
        this.name = name;
        this.color = color;
    }
}
class Feed {
    constructor(title, lst) {
        this.title = title;
        this.sources = lst;
    }
}
class View {
    constructor(lst, bkd = null) {
        this.bkd = (bkd ? bkd : this.dfbkd(lst.length));
        this.feeds = lst;
    }

    dfbkd(l) {
        if (l == 3)
            return [1, 2, 1];
        return Array(l).fill(1)
    }
}
class Layout {
    constructor(title, lst) {
        this.title = title;
        var last = lst.length - 1;
        if (lst[last].feeds.length > 1) {
            var scs = lst[last].feeds.flatMap(feed => feed.sources);
            scs = [...new Set(scs)];
            lst.push(new View([new Feed(null, scs)]));
        }
        this.views = lst;
    }
}

const colors = {
    white: 'white', // c-span, podcasts
    blue: 'azure', // Economist, Atlantic, PBS, Politico
    dblue: 'paleturquoise', // NYT
    yellow: 'beige', // Hard sci
    red: 'mistyrose', // WSJ
    dred: 'lightcoral', // WSJ opinion
    green: '#d6ffd6', // Bloomberg, MW, Forbes, Barron's (no RSS)
    purple: 'lavender', // Blog posts
    orange: 'oldlace', // Soft sci

}

// Some shortcuts for sourcing
function c1(jn) {
    rep = {};
    var m = jn.name;
    for (sc in jn.main) {
        var info = jn.main[sc];
        var n = info[info.length - 1];
        rep[sc] = new Source(
            jn.url(info[0]),
            ((m && n) ? `${m} > ${n}` : (m || n)),
            jn.color,
        );
    }
    return rep;
}

// A good place to start:
// https://about.fb.com/wp-content/uploads/2016/05/rss-urls-1.pdf
const sources = {
    wsj: c1({
        name: 'WSJ',
        url: (w => 'https://feeds.content.dowjones.io/public/rss/' + w),
        color: colors.red,
        main: {
            opn: ['RSSOpinion', 'Opinion'],
            world: ['RSSWorldNews', 'World'],
            usbiz: ['WSJcomUSBusiness', 'US Business'],
            markets: ['RSSMarketsMain', 'Markets'],
            tech: ['RSSWSJD', 'Technology'],
            lifestyle: ['RSSLifestyle', 'Lifestyle'],
            usn: ['RSSUSNews', 'US News'],
            pol: ['socialpoliticsfeed', 'Politics'],
            econ: ['socialeconomyfeed', 'Economy'],
            arts: ['RSSArtsCulture', 'Arts & Culture'],
            estate: ['latestnewsrealestate', 'Estate'],
            pfin: ['RSSPersonalFinance', 'Personal finance'],
            hth: ['socialhealth', 'Health'],
            style: ['RSSStyle', 'Style'],
            sports: ['rsssportsfeed', 'Sports'],
        }
    }),
    mw: c1({
        name: 'MarketWatch',
        url: (w => 'https://feeds.content.dowjones.io/public/rss/' + w),
        color: colors.green,
        main: {
            top: ['mw_topstories', null], // not great, whiny letters
            rt: ['mw_realtimeheadlines', 'Real-time'],
            brk: ['mw_bulletins', 'Breaking'],
            urt: ['mw_marketpulse', 'Ultra real-time'],
        }
    }),
    nyt: c1({
        name: 'NYT',
        url: (w => 'https://rss.nytimes.com/services/xml/rss/nyt/' + w + ".xml"),
        color: colors.dblue,
        main: {
            home: ['HomePage', null],
            world: ['World'],
            us: ['US'],
            econ: ['Economy'],
            tech: ['Technology'],
            space: ['Space'],
            sunopn: ['sunday-review', 'Sunday review'],
            hth: ['Health'],
            art: ['Arts'],
            style: ['FashionandStyle', 'Fashion & Style'],
            // `Sports` is not updated properly, so one must do it manually.
            spt_bb: ['Baseball'],
            spt_gf: ['Golf'],
            spt_hk: ['Hockey'],
            spt_sc: ['Soccer'],
            spt_tn: ['Tennis'],
            spt_cb: ['CollegeBasketball', 'College basketball'],
            spt_cf: ['CollegeFootball', 'College football'],
            spt_pb: ['ProBasketball', 'Pro basketball'],
            spt_pf: ['ProFootball', 'Pro football'],
            // more NYT exists, listed on their site
        }
    }),
    econ: c1({
        name: 'The Economist',
        url: (w => 'https://economist.com/' + w + '/rss.xml'),
        color: colors.blue,
        main: {
            econ: ['finance-and-economics', 'Finance & economics'],
            biz: ['business', 'Business'],
            fx: ['free-exchange', 'Free exchange'],
            // many more Economist exist
        }
    }),
    pbs: c1({
        name: 'PBS',
        url: (w => 'https://www.pbs.org/newshour/feeds/rss/' + w),
        color: colors.blue,
        main: {
            hdl: ['headlines', 'Headlines'],
            pol: ['politics', 'Politics'],
            pod: ['podcasts/segments', 'Podcast segments'],
        }
    }),
    politico: c1({
        name: 'Politico',
        url: (w => `https://rss.politico.com/${w}.xml`),
        color: colors.blue,
        main: {
            cong: ['congress', 'Congress'],
            def: ['defense', 'Defense'],
            pol: ['politics-news', 'Politics'],
            hth: ['healthcare', 'Healthcare'],
        }
    }),
    yahoo: c1({
        name: 'Yahoo',
        url: (w => `https://${w}.yahoo.com/rss/economy`),
        color: colors.green,
        main: {
            fin: ['finance', 'Finance'],
        }
    }),
    barr: c1({
        name: "Barron\'s",
        url: (w => w),
        color: colors.white,
        main: {
            pod: ['https://video-api.shdsvc.dowjones.io/api/podcasts/feed/barron%27s%20live%20conference%20calls', "live podcast"],
        }
    }),
    ebsco: c1({
        // A new alert/feed must be created yearly
        name: 'EBSCO',
        url: (w => 'https://research.ebsco.com/rss/' + w),
        color: colors.green,
        main: {
            bloom: ['c2E6MTBjZjI4MzctMWJhNC00MzgwLTkyYmMtMTY1NjBkOTM1ODdh', 'Bloomberg'],
            forbes: ['c2E6NTYyMDM2MjAtYjk1MC00OGQ2LTgxNzYtOGI4MGQ3NThmNDE4', 'Forbes'],
            // TODO: Atlantic
        }
    }),
    nasa: c1({
        name: 'NASA',
        url: (w => 'https://www.nasa.gov/' + w),
        color: colors.orange,
        main: {
            all: ['feed', null],
            iotd: ['feeds/iotd-feed', 'Image of the Day'],
            news: ['news-release/feed', 'News'],
            // more NASA exists, listed on their site
        }
    }),
    pubmed: c1({
        name: 'PubMed',
        url: (w => 'https://pubmed.ncbi.nlm.nih.gov/rss/search/' + w + '/?limit=50'),
        color: colors.yellow,
        // add on to url: '&utm_campaign=pubmed-2&fc=20261003035059'
        main: {
            jnls: ['1RIspYzP7ykXpaKqWcD6U7mB7ndQGZAyMrCA9GH1vJEyOPMUXf', 'High impact journals'],
        }
    }),
    arxiv: c1({
        name: 'arXiv',
        url: (w => 'https://rss.arxiv.org/rss/' + w),
        color: colors.yellow,
        main: {
            math: ['math', 'Math'],
            // many, many more exist
        }
    }),
    sciam: c1({
        name: 'Scientific American',
        url: (w => 'http://rss.sciam.com/' + w),
        color: colors.orange,
        main: {
            all: ['ScientificAmerican-Global', null],
            news: ['ScientificAmerican-News', 'News'],
            basic: ['basic-science', 'Basic Science'],
            space: ['sciam/space', 'Space'],
        }
    }),
    physorg: c1({
        name: 'Phys.org',
        url: (w => 'https://phys.org/rss-feed/' + w),
        color: colors.orange,
        main: {
            all: ['', null],
            nano: ['nanotech-news', 'Nanotech'],
            phys: ['physics-news', 'Physics'],
            space: ['space-news', 'Space'],
            chem: ['chemistry-news', 'Chem'],
            bio: ['biology-news', 'Bio'],
            math: ['science-news/mathematics', 'Math'],
            econ: ['science-news/economics-business', 'Economics'], // opinion-flavored
            // more exist, on their site
        }
    }),
    wp: c1({
        name: 'WordPress',
        url: (w => `https://${w}.wordpress.com/feed/`),
        color: colors.purple,
        main: {
            tt: ['terrytao', 'Terry Tao'],
        }
    }),
    wiki: c1({
        name: 'Wikipedia',
        url: (w => w),
        color: colors.orange,
        main: {
            home: ['https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=atom', 'Home'],
            potd: ['https://commons.wikimedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom&language=en', 'PoTD']
        }
    }),
    csp: c1({
        name: 'C-SPAN',
        url: (w => 'https://feeds.megaphone.fm/' + w),
        color: colors.white,
        main: {
            wtd: ['cspanwashingtontoday', 'Washington Today'],
            csf: ['CSPAN8750886650', 'Ceasefire'],
            hist: ['cspantheweekly', 'Extreme Mortman'],
        }
    }),
    hill: c1({
        name: 'The Hill',
        url: (w => 'https://thehill.com/' + w + '/feed'),
        color: colors.white,
        main: {
            news: ['homenews', 'News'],
            biz: ['business', 'Business'],
            p_def: ['defense', 'Defense'],
            p_ene: ['energy-environment', 'Energy & Environment'],
            p_fin: ['finance', 'Finance'],
            p_hth: ['healthcare', 'Healthcare'],
            p_tech: ['technology', 'Technology'],
            p_tra: ['transportation', 'Transportation'],
            p_intl: ['international', 'International'],
        }
    }),
    /*ktn: c1({
        /*
         * Kill the Newsletter! turns email newsletters into atom feeds.
         * To edit settings or delete a feed, delete the '.xml' at the end of
         * one of the feed urls, and you'll get the info page. This also gives
         * you the email with which to subscribe to various sources.
         * /
        name: 'KtN',
        url: (w => `https://kill-the-newsletter.com/feeds/${w}.xml`),
        color: colors.yellow,
        main: {
            blt: ['3rv538bl1bbmkokdxdn8shjtvpyl71cqzl48p6sx', 'BallotPedia'],
        }
    }),*/
    onion: new Source(
        'https://theonion.com/feed/',
        "The Onion",
        colors.purple,
    ),
    scotus: new Source(
        'https://www.scotusblog.com/feed/',
        'SCOTUSblog',
        colors.white,
    ),
    cs: {
        hn: new Source(
            'https://hnrss.org/frontpage', //'https://news.ycombinator.com/rss',
            'Hacker News',
            colors.orange,
        ),
        ars: new Source(
            'http://feeds.arstechnica.com/arstechnica/index/',
            'Ars Technica',
            colors.orange,
        ),
        lwn: new Source(
            'https://lwn.net/headlines/newrss',
            'LWN',
            colors.purple,
        )
    },
    cfr: new Source(
        'https://www.cfr.org/feed',
        'Council on Foreign Relations',
        colors.purple,
    ),
    bul: new Source(
        'https://www.thebulwark.com/feed',
        'The Bulwark',
        colors.purple,
    ),
    btp: new Source(
        'https://news.ballotpedia.org/feed/',
        'BallotPedia',
        colors.yellow,
    ),
    local: {
        patch: new Source(
            'https://kill-the-newsletter.com/feeds/tuvi8646se065dtrlmcakd7xplfr02yd5kvmtp37.xml',
            'KtN > Patch',
            colors.green,
        ),
        lcgov: new Source(
            'https://kill-the-newsletter.com/feeds/0xefh9uf7am1nzelvw3t192cminnustw0iofh8nr.xml',
            'KtN > Cupertino.gov, SanJoseCA.gov',
            colors.white,
        ),
        tino: c1({
            name: 'Cupertino',
            url: (w => `https://cupertino${w}/feed`),
            color: colors.blue,
            main: {
                ctd: ['today.com', 'Cupertino Today'],
                cm: ['matters.org', 'Cupertino Matters'],
                cf: ['facts.org', 'Cupertino Facts'],
            }
        }),
        cities: c1({
            name: 'Nearby',
            url: (w => `https://${w}.com/feed`),
            color: colors.green,
            main: {
                mv: ['www.mv-voice', 'Mountain View Voice'],
                sv: ['www.svvoice', 'Silicon Valley Voice'],
                pa: ['padailypost', 'Palo Alto Daily Post'],
                rw: ['www.rwcpulse', 'Redwood City Pulse'],
                lg: ['losgatan', 'Los Gatan'],
                pao: ['www.paloaltoonline', 'Palo Alto Online'],
                kron: ['www.kron4', 'KRON4'],
            }
        }),
        sj: c1({
            name: 'San Jose',
            url: (w => `https://${w}.com/feed`),
            color: colors.green,
            main: {
                s: ['sanjosespotlight', 'San Jose Spotlight'],
                i: ['www.sanjoseinside', 'San Jose Inside'],
            }
        }),
        sfgate: new Source(
            'https://www.sfgate.com/rss/feed/Top-News-Stories-595.php',
            'SFGATE',
            colors.red,
        ),
        sfist: new Source(
            'https://sfist.com/rss/',
            'SFist',
            colors.red,
        ),
        cal: c1({
            name: 'CA',
            url: (w => `https://${w}.org/feed`),
            color: colors.yellow,
            main: {
                cm: ['calmatters', 'CalMatters'],
                kq: ['ww2.kqed', 'KQED'],
                sb: ['cal.streetsblog', 'StreetsBlog'],
            }
        }),
        lao: c1({
            name: 'Legislative Analyst\'s Office',
            url: (w => `https://lao.ca.gov/laoapp/rss/LAORSSFeedNew.aspx?laofeed=${w}`),
            color: colors.purple,
            main: {
                3: [3, null],
                4: [4, null],
                5: [5, null],
                7: [7, null],
                8: [8, null],
                9: [9, null],
                10: [10, null],
                11: [11, null],
                12: [12, null],
                13: [13, null],
                14: [14, null],
                15: [15, null],
                21: [21, null],
                25: [25, null],
            }
        })
    },
    // TODO: AAAS? zbMATH is cloudflare blocked
    // https://news.ycombinator.com/item?id=16908241
    // Tangle? Paywalled
    // DO NOT put Newsweek here. See Ad Fontes' ratings of their various
    // articles, and read the explanations. They use AI without disclosing it,
    // and the AI tends to make mistakes. They also don't disclose corrections.
};
var safesl = ((ls, n) => (n < ls.length) ? ls.slice(0, n) : ls)
var limn = (n => (ls => safesl(ls, n)));
var last = (ls => [ls[ls.length - 1]]);
sources.nasa.iotd.postproc = limn(1);
sources.onion.postproc = limn(1);
sources.wiki.home.postproc = last;
sources.wiki.potd.postproc = last;
sources.wsj.opn.color = colors.dred;
sources.cs.hn.postproc = (l => l.map(e => {
    var el = elem('div');
    el.innerHTML = e.pieced;

    try {
        var setartl = elem('a');
        setartl.textContent = 'Article.';
        setartl.href = el.childNodes[0].childNodes[1].href;

        var setcom = elem('a');
        setcom.textContent = 'Comments.';
        setcom.href = el.childNodes[2].childNodes[1].href;
        e.piecel = setcom.href;

        e.pieced = setartl.outerHTML + "<br>"
            + setcom.outerHTML
            + el.childNodes[4].outerHTML
            + el.childNodes[6].outerHTML;
        return e;
    } catch (ex) {
        return null;
    }
}).filter(e => (e != null)));
sources.scotus.postproc = (l => l.map(e => {
    var descr = petty_line(get(e.raw, 'encoded'))
    var ind = descr.indexOf('</p>');
    descr = descr.substring(0, ind + 4);
    e.pieced = descr;
    return e;
}));

sources.wsj.gravity = GRAV / 2;

const LAYS = {
    pol: new Layout('Politics', [
        new View([
            new Feed('left', [
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.sunopn,
                sources.nyt.home,
            ]),
            new Feed('center (ish)', [
                sources.hill.news,
                sources.hill.biz,
                sources.csp.wtd,
                sources.scotus,
                sources.cfr,
                sources.btp,
            ]),
            new Feed('spread', [
                sources.pbs.hdl,
                sources.pbs.pol,
                sources.wsj.world,
                sources.wsj.usbiz,
                sources.wsj.pol,
                sources.wsj.usn,
                sources.politico.cong,
                sources.politico.def,
                sources.politico.pol,
                sources.politico.hth,
                sources.econ.biz,
                sources.econ.fx,
                //sources.bul,
            ]),
            new Feed('right', [
                sources.wsj.opn,
            ]),
        ]),
        new View([
            new Feed('less biased', [
                sources.scotus,
                sources.hill.news,
                sources.hill.biz,
                sources.csp.wtd,
                sources.scotus,
                sources.cfr,
                sources.btp,
            ]),
            new Feed('medium', [
                sources.politico.cong,
                sources.politico.def,
                sources.politico.pol,
                sources.politico.hth,
                sources.wsj.world,
                sources.wsj.usbiz,
                sources.wsj.pol,
                sources.wsj.usn,
                sources.econ.biz,
                sources.econ.fx,
                sources.pbs.hdl,
                sources.pbs.pol,
            ]),
            new Feed('more biased', [
                sources.wsj.opn,
                sources.nyt.home,
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.sunopn,
                //sources.bul,
            ]),
        ], [1, 1, 1]),
        new View([
            new Feed('lower bias', [
                sources.scotus,
                sources.hill.news,
                sources.hill.biz,
                sources.csp.wtd,
                sources.politico.cong,
                sources.politico.def,
                sources.politico.pol,
                sources.politico.hth,
                sources.wsj.world,
                sources.wsj.usbiz,
                sources.wsj.pol,
                sources.wsj.usn,
                sources.econ.biz,
                sources.econ.fx,
                sources.cfr,
                sources.pbs.hdl,
                sources.pbs.pol,
                sources.btp,
            ]),
            new Feed('higher bias', [
                sources.wsj.opn,
                sources.nyt.home,
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.sunopn,
                //sources.bul,
            ]),
        ], [2, 1]),
    ]),
    fin: new Layout('Financials', [
        new View([
            new Feed('the economist', [
                sources.econ.econ,
                sources.econ.fx,
            ]),
            new Feed('headlines & macro', [
                sources.mw.brk,
                sources.wsj.markets,
                sources.wsj.econ,
                sources.nyt.econ,
                sources.barr.pod,
            ]),
            new Feed('businesses', [
                sources.wsj.usbiz,
                sources.wsj.tech,
                sources.econ.biz,
                sources.nyt.tech,
                sources.ebsco.forbes,
                sources.ebsco.bloom,
                sources.mw.rt,
                sources.mw.urt,
                sources.yahoo.fin,
            ]),
        ]),
    ]),
    sci: new Layout('Nerdy', [
        new View([
            new Feed('mainstream', [
                //sources.sciam.all, // lower quality
                sources.nasa.iotd,
                sources.nasa.news,
                sources.cs.ars,
            ]),
            new Feed('software', [
                sources.cs.hn,
                sources.cs.lwn,
            ]),
            new Feed('middle ground', [
                sources.wp.tt,
                sources.physorg.nano,
                sources.physorg.phys,
                // sources.physorg.space, // using others for space
                sources.physorg.chem,
                sources.physorg.bio,
                // sources.physorg.math, // using others for math
            ]),
            new Feed('research', [
                sources.pubmed.jnls,
                sources.arxiv.math,
            ]),
        ]),
        new View([
            new Feed('news', [
                sources.nasa.iotd,
                sources.nasa.news,
                sources.wp.tt,
            ]),
            new Feed('research', [
                sources.pubmed.jnls,
                sources.arxiv.math,
                sources.physorg.phys,
                sources.physorg.chem,
                sources.physorg.bio,
            ]),
            new Feed('software', [
                sources.cs.hn,
                sources.cs.lwn,
            ]),
        ]),
        new View([
            new Feed('light', [
                sources.nasa.iotd,
                sources.nasa.news,
                sources.wp.tt,
                sources.cs.hn,
                sources.cs.lwn,
            ]),
            new Feed('heavy', [
                sources.pubmed.jnls,
                sources.arxiv.math,
                sources.physorg.phys,
                sources.physorg.chem,
                sources.physorg.bio,
            ]),
        ]),
    ]),
    local: new Layout('Local', [
        new View([
            new Feed('community', [
                sources.local.tino.ctd,
                sources.local.tino.cm,
                sources.local.tino.cf,
                sources.local.patch,
            ]),
            new Feed('government', [
                sources.local.lcgov,
            ].concat(
                (() => {
                    var ls = [21, 25];
                    for (i = 3; i <= 15; i++)
                        if (i != 6)
                            ls.push(i);
                    ls = ls.map(n => sources.local.lao[n]);
                    return ls;
                })()
            )),
            new Feed('analysis', [
                sources.local.sfgate,
                sources.local.sfist,
                sources.local.cal.cm,
                sources.local.cal.kq,
                sources.local.cal.sb,
                sources.local.sj.i,
                sources.local.sj.s,
            ]),
            new Feed('nearby', [
                sources.local.cities.mv,
                sources.local.cities.sv,
                sources.local.cities.pa,
                sources.local.cities.rw,
                sources.local.cities.lg,
                sources.local.cities.pao,
                sources.local.cities.kron,
            ]),
        ]),
        new View([
            new Feed('community', [
                sources.local.tino.ctd,
                sources.local.tino.cm,
                sources.local.tino.cf,
                sources.local.patch,
                sources.local.cities.mv,
                sources.local.cities.sv,
                sources.local.cities.pa,
                sources.local.cities.rw,
                sources.local.cities.lg,
                sources.local.cities.pao,
                sources.local.cities.kron,
            ]),
            new Feed('analysis', [
                sources.local.sfgate,
                sources.local.sfist,
                sources.local.cal.cm,
                sources.local.cal.kq,
                sources.local.cal.sb,
                sources.local.sj.i,
                sources.local.sj.s,
            ]),
            new Feed('government', [
                sources.local.lcgov,
            ].concat(
                (() => {
                    var ls = [21, 25];
                    for (i = 3; i <= 15; i++)
                        if (i != 6)
                            ls.push(i);
                    ls = ls.map(n => sources.local.lao[n]);
                    return ls;
                })()
            )),
        ]),
    ]),
};
LAYS.fin.postproc = (l => l.map(e => ({ ...e, 'media': (e.mediat == 'img' ? null : e.media) })));
