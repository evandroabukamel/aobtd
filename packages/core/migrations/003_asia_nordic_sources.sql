-- Sources for Russia, China, India, Korea, Japan and Scandinavia: national news agencies,
-- public broadcasters, established papers and the official investigation bodies.
-- Tabloids are left out on purpose. All of them are read through the Google News RSS search.
-- Asian outlets use their English editions, which the rule-based extractor understands;
-- NRK, SVT, NSIA and SHK are searched in Norwegian and Swedish.
-- Denmark has none: DR, TV2 and the Danish investigation board are not indexed by Google News.
INSERT INTO sources (slug, name, kind, country, homepage, feed_url, parser, scan_slot) VALUES
-- Russia
('tass', 'TASS', 'agency', 'RU',
 'https://tass.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22+OR+%22plane+crashed%22)+site:tass.com+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 0),
('moscow-times', 'The Moscow Times', 'agency', 'RU',
 'https://www.themoscowtimes.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22+OR+%22plane+crashed%22)+site:themoscowtimes.com+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 1),
('mak', 'MAK / Rosaviatsia (Rússia)', 'government', 'RU',
 'https://mak-iac.org', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+(%22Interstate+Aviation+Committee%22+OR+Rosaviatsia)+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 2),
-- China
('xinhua', 'Xinhua', 'agency', 'CN',
 'https://english.news.cn', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+site:english.news.cn+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 3),
('scmp', 'South China Morning Post', 'agency', 'HK',
 'https://www.scmp.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22+OR+%22plane+crashed%22)+site:scmp.com+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 0),
('caac', 'CAAC (China)', 'government', 'CN',
 'https://www.caac.gov.cn', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+%22Civil+Aviation+Administration+of+China%22+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 1),
-- India
('aaib-india', 'AAIB / DGCA (Índia)', 'government', 'IN',
 'https://www.aaib.gov.in', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+(AAIB+OR+DGCA)+India+when:2d&hl=en-IN&gl=IN&ceid=IN:en', 'rss', 2),
('the-hindu', 'The Hindu', 'agency', 'IN',
 'https://www.thehindu.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22+OR+%22plane+crashed%22)+site:thehindu.com+when:2d&hl=en-IN&gl=IN&ceid=IN:en', 'rss', 3),
('indian-express', 'The Indian Express', 'agency', 'IN',
 'https://indianexpress.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22+OR+%22plane+crashed%22)+site:indianexpress.com+when:2d&hl=en-IN&gl=IN&ceid=IN:en', 'rss', 0),
-- South Korea
('yonhap', 'Yonhap', 'agency', 'KR',
 'https://en.yna.co.kr', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+site:yna.co.kr+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 1),
('korea-herald', 'The Korea Herald', 'agency', 'KR',
 'https://www.koreaherald.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22+OR+%22plane+crashed%22)+site:koreaherald.com+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 2),
('araib', 'ARAIB (Coreia do Sul)', 'government', 'KR',
 'https://araib.molit.go.kr', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+(ARAIB+OR+%22Aviation+and+Railway+Accident+Investigation%22)+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 3),
-- Japan
('nhk', 'NHK World', 'agency', 'JP',
 'https://www3.nhk.or.jp/nhkworld', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+site:nhk.or.jp+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 0),
('kyodo', 'Kyodo News', 'agency', 'JP',
 'https://english.kyodonews.net', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+site:kyodonews.net+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 1),
('jtsb', 'JTSB (Japão)', 'government', 'JP',
 'https://www.mlit.go.jp/jtsb', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+(JTSB+OR+%22Japan+Transport+Safety+Board%22)+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 2),
-- Scandinavia
('nrk', 'NRK (Noruega)', 'agency', 'NO',
 'https://www.nrk.no', 'https://news.google.com/rss/search?q=(flystyrt+OR+helikopterstyrt+OR+flyulykke+OR+helikopterulykke+OR+styrtet+OR+havarerte)+site:nrk.no+when:2d&hl=no&gl=NO&ceid=NO:no', 'rss', 3),
('svt', 'SVT (Suécia)', 'agency', 'SE',
 'https://www.svt.se', 'https://news.google.com/rss/search?q=(flygolycka+OR+flyghaveri+OR+helikopterolycka+OR+st%C3%B6rtade+OR+n%C3%B6dlandade+OR+kraschade)+site:svt.se+when:2d&hl=sv&gl=SE&ceid=SE:sv', 'rss', 0),
('nsia', 'NSIA / Havarikommisjonen (Noruega)', 'government', 'NO',
 'https://www.nsia.no', 'https://news.google.com/rss/search?q=(flyulykke+OR+flystyrt+OR+helikopterulykke)+(Havarikommisjonen+OR+NSIA)+when:2d&hl=no&gl=NO&ceid=NO:no', 'rss', 1),
('shk', 'SHK / Statens haverikommission (Suécia)', 'government', 'SE',
 'https://www.shk.se', 'https://news.google.com/rss/search?q=(flygolycka+OR+flyghaveri+OR+st%C3%B6rtade)+(Haverikommissionen+OR+SHK)+when:2d&hl=sv&gl=SE&ceid=SE:sv', 'rss', 2);
