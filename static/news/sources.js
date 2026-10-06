class Source {
    postproc = (e => e);
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
    constructor(title, lst, bkd = null, mxlen = 5_000) {
        this.title = title;
        this.feeds = lst;
        this.bkd = (bkd ? bkd : this.dfbkd(lst.length));
        this.mxlen = mxlen;
    }

    dfbkd(l) {
        if (l == 3)
            return [1, 2, 1];
        return Array(l).fill(1)
    }
}

const colors = {
    white: 'white', // c-span, podcasts
    blue: 'azure', // NYT, Economist, Atlantic
    yellow: 'beige', // Hard sci
    red: 'mistyrose', // WSJ
    green: 'honeydew', // Bloomberg, MW, Forbes, Barron's (no RSS)
    purple: 'lavender', // Blog posts
    orange: 'oldlace', // Soft sci
}

// A good place to start:
// https://about.fb.com/wp-content/uploads/2016/05/rss-urls-1.pdf
const sources = {
    wsj: {
        // WSJ
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
    },
    mw: {
        // Market Watch
        name: 'MarketWatch',
        url: (w => 'https://feeds.content.dowjones.io/public/rss/' + w),
        color: colors.green,
        main: {
            top: ['mw_topstories', null], // not great, whiny letters
            rt: ['mw_realtimeheadlines', 'Real-time'],
            brk: ['mw_bulletins', 'Breaking'],
            urt: ['mw_marketpulse', 'Ultra real-time'],
        }
    },
    nyt: {
        // NYT
        name: 'NYT',
        url: (w => 'https://rss.nytimes.com/services/xml/rss/nyt/' + w + ".xml"),
        color: colors.blue,
        main: {
            world: ['World'],
            us: ['US'],
            econ: ['Economy'],
            tech: ['Technology'],
            space: ['Space'],
            sunopn: ['sunday-review', 'Sunday review'],
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
    },
    econ: {
        // Economist
        name: 'The Economist',
        url: (w => 'https://economist.com/' + w + '/rss.xml'),
        color: colors.blue,
        main: {
            econ: ['finance-and-economics', 'Finance & economics'],
            biz: ['business', 'Business'],
            fx: ['free-exchange', 'Free exchange'],
            // many more Economist exist
        }
    },
    yahoo: {
        name: 'Yahoo',
        url: (w => `https://${w}.yahoo.com/rss/economy`),
        color: colors.green,
        main: {
            fin: ['finance', 'Finance'],
        }
    },
    barr: {
        name: "Barron\'s",
        url: (w => w),
        color: colors.white,
        main: {
            pod: ['https://video-api.shdsvc.dowjones.io/api/podcasts/feed/barron%27s%20live%20conference%20calls', "live podcast"],
        }
    },
    ebsco: {
        // Bloomberg, via EBSCO, via SCCLD
        // A new alert/feed must be created yearly
        name: 'EBSCO',
        // url: (w => 'https://research-ebsco-com.rpa.sccl.org/rss/' + w),
        url: (w => 'https://research.ebsco.com/rss/' + w),
        color: colors.green,
        main: {
            bloom: ['c2E6MTBjZjI4MzctMWJhNC00MzgwLTkyYmMtMTY1NjBkOTM1ODdh', 'Bloomberg'],
            forbes: ['c2E6NTYyMDM2MjAtYjk1MC00OGQ2LTgxNzYtOGI4MGQ3NThmNDE4', 'Forbes'],
        }
    },
    // TODO: Atlantic. Don't have read access though
    nasa: {
        // NASA
        name: 'NASA',
        url: (w => 'https://www.nasa.gov/' + w),
        color: colors.orange,
        main: {
            all: ['feed', null],
            iotd: ['feeds/iotd-feed', 'Image of the Day'],
            news: ['news-release/feed', 'News'],
            // more NASA exists, listed on their site
        }
    },
    pubmed: {
        name: 'PubMed',
        url: (w => 'https://pubmed.ncbi.nlm.nih.gov/rss/search/' + w + '/?limit=50'),
        color: colors.yellow,
        // add on to url: '&utm_campaign=pubmed-2&fc=20261003035059'
        main: {
            jnls: ['1RIspYzP7ykXpaKqWcD6U7mB7ndQGZAyMrCA9GH1vJEyOPMUXf', 'High impact journals'],
        }
    },
    sciam: {
        name: 'Scientific American',
        url: (w => 'http://rss.sciam.com/' + w),
        color: colors.orange,
        main: {
            all: ['ScientificAmerican-Global', null],
            news: ['ScientificAmerican-News', 'News'],
            basic: ['basic-science', 'Basic Science'],
            space: ['sciam/space', 'Space'],
        }
    },
    physorg: {
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
    },
    tt: {
        name: 'Terry Tao',
        url: (w => `https://${w}.wordpress.com/feed/`),
        color: colors.purple,
        main: {
            all: ['terrytao', null],
        }
    },
    wiki: {
        name: 'Wikipedia',
        url: (w => w),
        color: colors.orange,
        main: {
            home: ['https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=atom', 'Home'],
            potd: ['https://commons.wikimedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom&language=en', 'PoTD']
        }
    },
    csp: {
        name: 'C-SPAN',
        url: (w => 'https://feeds.megaphone.fm/' + w),
        color: colors.white,
        main: {
            wtd: ['cspanwashingtontoday', 'Washington Today'],
            csf: ['CSPAN8750886650', 'Ceasefire'],
            hist: ['cspantheweekly', 'Extreme Mortman'],
        }
    },
    hill: {
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
    }
    // TODO: arXiv? AAAS? zbMATH is cloudflare blocked
};
for (key in sources) {
    rep = {};
    jn = sources[key];
    for (sc in jn.main) {
        info = jn.main[sc];
        u = info[0], n = info[info.length - 1];
        rep[sc] = new Source(
            jn.url(info[0]),
            (n ? `${jn.name} > ${n}` : jn.name),
            jn.color,
        );
    }
    sources[key] = rep;
}
safesl = ((ls, n) => (n < ls.length) ? ls.slice(0, n) : ls)
limn = (n => (ls => safesl(ls, n)));
last = (ls => [ls[ls.length - 1]]);
sources.nasa.iotd.postproc = limn(1);
sources.wiki.home.postproc = last;
sources.wiki.potd.postproc = last;

const views = {
    main: new View('Main', [
        new Feed('markets', [
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
            sources.wsj.health,
            sources.hill.news,
            sources.csp.wtd,
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
    fin: new View('Financials', [
        new Feed('live updates & podcasts', [
            sources.mw.rt,
            sources.mw.urt,
            sources.yahoo.fin,
            sources.barr.pod,
        ]),
        new Feed('headlines & macro', [
            sources.mw.brk,
            sources.wsj.markets,
            sources.wsj.econ,
            sources.nyt.econ,
            sources.econ.econ,
        ]),
        new Feed('tech & business', [
            sources.wsj.usbiz,
            sources.wsj.tech,
            sources.econ.biz,
            sources.nyt.tech,
            sources.ebsco.forbes,
            sources.ebsco.bloom,
        ]),
    ]),
    pol: new View('Politics', [
        new Feed('left lean', [
            sources.econ.biz,
            sources.econ.fx,
            sources.nyt.world,
            sources.nyt.us,
            sources.nyt.econ,
            sources.nyt.tech,
            sources.nyt.sunopn,
            sources.econ.econ,
        ]),
        new Feed('center', [
            sources.csp.wtd,
            sources.csp.csf,
            sources.hill.news,
            sources.hill.biz,
        ]),
        new Feed('right lean', [
            sources.wsj.markets,
            sources.wsj.opn,
            sources.wsj.world,
            sources.wsj.usbiz,
            sources.wsj.tech,
            sources.wsj.pol,
            sources.wsj.health,
            sources.wsj.econ,
            sources.wsj.usn,
        ]),
    ], [2, 1, 2]),
    sci: new View('Science', [
        new Feed('mainstream', [
            sources.sciam.all,
            sources.sciam.news,
            sources.sciam.space,
            sources.sciam.basic,
            //sources.nyt.space,
            sources.nasa.iotd,
            sources.physorg.nano,
            sources.physorg.phys,
            sources.physorg.space,
            sources.physorg.chem,
            sources.physorg.bio,
            sources.physorg.math,
        ]),
        new Feed('research & niche', [
            sources.pubmed.jnls,
            sources.tt.all,
        ]),
    ]),
    cul: new View('Culture', [
        /*new Feed('dailies', [
            sources.wiki.potd,
            sources.wiki.home,
        ]),*/
        new Feed('sports', [
            sources.wsj.sports,
            sources.nyt.spt_bb,
            sources.nyt.spt_gf,
            sources.nyt.spt_hk,
            sources.nyt.spt_sc,
            sources.nyt.spt_tn,
            sources.nyt.spt_cb,
            sources.nyt.spt_cf,
            sources.nyt.spt_pb,
            sources.nyt.spt_pf,
        ]),
        new Feed('arts, fashion & lifestyle', [
            sources.wsj.arts,
            sources.wsj.style,
            sources.wsj.lifestyle,
            sources.nyt.art,
        ]),
    ]),
};
