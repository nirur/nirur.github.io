const LIM = 20;

class Source {
    constructor(url, name, color, postproc = (e => e)) {
        this.url = url;
        this.name = name;
        this.color = color;
        this.postproc = postproc;
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
        //this.mxlen = mxlen;
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
    green: 'honeydew', // Bloomberg, MW, Forbes, Barron's (no RSS)
    purple: 'lavender', // Blog posts
    orange: 'oldlace', // Soft sci
}

// Some shortcuts for sourcing
function c1(jn) {
    rep = {};
    for (sc in jn.main) {
        info = jn.main[sc];
        u = info[0], n = info[info.length - 1];
        rep[sc] = new Source(
            jn.url(info[0]),
            (n ? `${jn.name} > ${n}` : jn.name),
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
            health: ['socialhealth', 'Health'],
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
    // TODO: AAAS? zbMATH is cloudflare blocked
    // SCOTUS blog: https://www.scotusblog.com/feed/
    // Hacker News, more techy: https://news.ycombinator.com/item?id=16908241
    // Tangle?
};
var safesl = ((ls, n) => (n < ls.length) ? ls.slice(0, n) : ls)
var limn = (n => (ls => safesl(ls, n)));
var last = (ls => [ls[ls.length - 1]]);
sources.nasa.iotd.postproc = limn(1);
sources.onion.postproc = limn(1);
sources.wiki.home.postproc = last;
sources.wiki.potd.postproc = last;
sources.wsj.opn.color = colors.dred;

const LAYS = {
    main: new Layout('Main', [
        new View([
            new Feed('economy', [
                sources.wsj.markets,
                sources.wsj.usbiz,
                sources.nyt.econ,
                sources.econ.econ,
                sources.ebsco.forbes,
                sources.ebsco.bloom,
                sources.mw.rt,
                sources.mw.brk,
                sources.mw.urt,
            ]),
            new Feed('headlines', [
                sources.wsj.pol,
                sources.wsj.usn,
                sources.wsj.opn,
                sources.wsj.world,
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.hth,
                sources.wsj.health,
                sources.hill.news,
                sources.csp.wtd,
                sources.onion,
            ]),
            new Feed('science', [
                sources.pubmed.jnls,
                sources.sciam.all,
                sources.sciam.news,
                sources.physorg.phys,
                sources.physorg.space,
                sources.nasa.iotd,
                //sources.nyt.space,
            ]),
        ]),
        new View([
            new Feed('in the news', [
                sources.wsj.pol,
                sources.wsj.usn,
                sources.wsj.opn,
                sources.wsj.world,
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.hth,
                sources.wsj.health,
                sources.hill.news,
                sources.csp.wtd,
                sources.wsj.markets,
                sources.wsj.usbiz,
                sources.nyt.econ,
                sources.econ.econ,
                sources.ebsco.forbes,
                sources.ebsco.bloom,
                sources.mw.rt,
                sources.mw.brk,
                sources.mw.urt,
                sources.onion,
                sources.pbs.hdl,
                sources.pbs.pol,
            ]),
            new Feed('science', [
                sources.pubmed.jnls,
                sources.sciam.all,
                sources.sciam.news,
                sources.physorg.phys,
                sources.physorg.space,
                sources.nasa.iotd,
            ]),
        ], bkd = [2, 1]),
    ]),
    fin: new Layout('Financials', [
        new View([
            new Feed('headlines & macro', [
                sources.mw.brk,
                sources.wsj.markets,
                sources.wsj.econ,
                sources.nyt.econ,
                sources.econ.econ,
                sources.barr.pod,
            ]),
            new Feed('tech & business', [
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
    pol: new Layout('Politics', [
        new View([
            new Feed('left', [
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.sunopn,
                sources.nyt.hth,
            ]),
            new Feed('center (ish)', [
                sources.pbs.hdl,
                sources.pbs.pol,
                sources.politico.cong,
                sources.politico.def,
                sources.politico.pol,
                sources.politico.hth,
                sources.hill.news,
                sources.hill.biz,
                sources.csp.wtd,
                sources.wsj.world,
                sources.wsj.usbiz,
                sources.wsj.pol,
                sources.wsj.health,
                sources.wsj.usn,
                sources.econ.biz,
                sources.econ.fx,
            ]),
            new Feed('right', [
                sources.wsj.opn,
            ]),
        ]),
        new View([
            new Feed('less biased', [
                sources.pbs.hdl,
                sources.pbs.pol,
                sources.politico.cong,
                sources.politico.def,
                sources.politico.pol,
                sources.politico.hth,
                sources.hill.news,
                sources.hill.biz,
                sources.csp.wtd,
                sources.wsj.world,
                sources.wsj.usbiz,
                sources.wsj.pol,
                sources.wsj.health,
                sources.wsj.usn,
                sources.econ.biz,
                sources.econ.fx,
            ]),
            new Feed('more biased', [
                sources.wsj.opn,
                sources.nyt.world,
                sources.nyt.us,
                sources.nyt.sunopn,
                sources.nyt.hth,
            ]),
        ], [2, 1]),
        new View([
            new Feed(null, [
                sources.pbs.hdl,
                sources.pbs.pol,
                sources.econ.biz,
                sources.econ.fx,
                sources.politico.cong,
                sources.politico.def,
                sources.politico.pol,
                sources.politico.hth,
                sources.hill.news,
                sources.hill.biz,
                sources.csp.wtd,
                sources.wsj.world,
                sources.wsj.usbiz,
                sources.wsj.pol,
                sources.wsj.health,
                sources.wsj.usn,
            ]),
        ]),
    ]),
    sci: new Layout('Science', [
        new View([
            new Feed('mainstream', [
                sources.sciam.all,
                sources.sciam.news,
                sources.sciam.space,
                sources.sciam.basic,
                //sources.nyt.space,
                sources.nasa.iotd,
                sources.nasa.news,
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
                sources.sciam.all,
                sources.nasa.iotd,
                sources.nasa.news,
                sources.wp.tt,
                sources.physorg.phys,
                sources.physorg.chem,
                sources.physorg.bio,
            ]),
            new Feed('research', [
                sources.pubmed.jnls,
                sources.arxiv.math,
            ]),
        ]),
    ]),
};
