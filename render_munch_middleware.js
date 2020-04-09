let cache = require('memory-cache');
let duration=100000;
const puppeteer = require('puppeteer');
const debug=require('debug')('render_munch')
let memCache = new cache.Cache();
let cachedData = async (req, res, next) => {

    var botPattern = "(googlebot\/|bot|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|WhatsApp|AddThis)";
    var re = new RegExp(botPattern, 'i');
    var userAgent = req.headers["user-agent"];
    if (re.test(userAgent)) {
        debug('the user agent is a crawler!::::',userAgent);
        let key = '__express__' + req.originalUrl || req.url
        let cacheContent = memCache.get(key);
        if (cacheContent) {
            debug('found in cache');
            // debug(cacheContent);
            res.send(cacheContent);
            return
        } else {
            res.sendResponse = res.send
            debug('launching pup');
            try {
                const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
                const page = await browser.newPage();
                await page.setRequestInterception(true);

                page.on('request', (req) => {
                    if(req.resourceType() === 'image'){
                        req.abort();
                    }
                    else {
                        req.continue();
                    }
                });

                debug('new page added');
                // const local_url = 'http://localhost:8000' + req.originalUrl;
                const local_url = req.protocol + '://' + req.get('host') + req.originalUrl;
                debug("fetching:::", local_url);
                await page.goto(local_url, {
                    waitUntil: "networkidle0",
                });
                debug('page loaded');
                const html = await page.evaluate(() => {
                    return document.documentElement.innerHTML;
                });
                debug('PUTTING IN CACHE');
                memCache.put(key, html, duration * 1000);
                res.send(html);
                debug('closing page');
                await page.close();
                debug('closing browser');
                await browser.close();
                debug('All closed');
            }catch (e) {
                debug(e);
                next(e);
            }
            // next()
            // res.send = (body) => {
            //
            //     res.sendResponse(body)
            // }
        }

    } else {
        debug('the user agent is a user!');
        next();

    }

}

let cacheMiddleware = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url
        let cacheContent = memCache.get(key);
        if (cacheContent) {

            res.json(JSON.parse(cacheContent));
            return
        } else {
            res.sendResponse = res.send
            res.send = (body) => {
                memCache.put(key, body, duration * 1000);
                res.sendResponse(body)
            }
            next()
        }
    }
}
module.exports = cachedData
