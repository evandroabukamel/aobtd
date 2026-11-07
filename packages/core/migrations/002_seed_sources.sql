-- Initial sources. Sources without their own RSS use the Google News RSS search
-- restricted to the official domain, which already returns only accident items.
INSERT INTO sources (slug, name, kind, country, homepage, feed_url, parser, scan_slot) VALUES
-- Window 0 (00h UTC)
('asn', 'Aviation Safety Network (Flight Safety Foundation)', 'database', NULL,
 'https://asn.flightsafety.org', 'https://asn.flightsafety.org/wikibase/dblist.php', 'asn_html', 0),
('bbc', 'BBC News', 'agency', 'GB',
 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'rss', 0),
('cenipa', 'CENIPA (FAB)', 'government', 'BR',
 'https://www.gov.br/fab/pt-br/assuntos/cenipa',
 'https://news.google.com/rss/search?q=(queda+OR+acidente)+(avi%C3%A3o+OR+aeronave+OR+helic%C3%B3ptero)+Cenipa+when:2d&hl=pt-BR&gl=BR&ceid=BR:pt-419', 'rss', 0),
-- Window 1 (06h UTC)
('reuters', 'Reuters', 'agency', NULL,
 'https://www.reuters.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22)+site:reuters.com+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 1),
('ntsb', 'NTSB', 'government', 'US',
 'https://www.ntsb.gov', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+NTSB+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 1),
('bea', 'BEA', 'government', 'FR',
 'https://bea.aero', 'https://news.google.com/rss/search?q=(accident+OR+crash)+(avion+OR+h%C3%A9licopt%C3%A8re)+BEA+when:2d&hl=fr&gl=FR&ceid=FR:fr', 'rss', 1),
-- Window 2 (12h UTC)
('ap', 'Associated Press', 'agency', NULL,
 'https://apnews.com', 'https://news.google.com/rss/search?q=(%22plane+crash%22+OR+%22helicopter+crash%22+OR+%22aircraft+crashed%22)+site:apnews.com+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 2),
('aaib', 'AAIB (Reino Unido)', 'government', 'GB',
 'https://www.gov.uk/government/organisations/air-accidents-investigation-branch',
 'https://www.gov.uk/government/organisations/air-accidents-investigation-branch.atom', 'rss', 2),
('tsb', 'TSB (Canadá)', 'government', 'CA',
 'https://www.tsb.gc.ca', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+%22Transportation+Safety+Board%22+when:2d&hl=en-CA&gl=CA&ceid=CA:en', 'rss', 2),
-- Window 3 (18h UTC)
('agencia-brasil', 'Agência Brasil (EBC)', 'agency', 'BR',
 'https://agenciabrasil.ebc.com.br', 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', 'rss', 3),
('atsb', 'ATSB (Austrália)', 'government', 'AU',
 'https://www.atsb.gov.au', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+ATSB+when:2d&hl=en-AU&gl=AU&ceid=AU:en', 'rss', 3),
('faa', 'FAA', 'government', 'US',
 'https://www.faa.gov', 'https://news.google.com/rss/search?q=(crash+OR+crashed)+(plane+OR+helicopter+OR+aircraft)+FAA+when:2d&hl=en-US&gl=US&ceid=US:en', 'rss', 3),
('bfu', 'BFU (Alemanha)', 'government', 'DE',
 'https://www.bfu-web.de', 'https://news.google.com/rss/search?q=(Absturz+OR+abgest%C3%BCrzt)+(Flugzeug+OR+Hubschrauber)+BFU+when:2d&hl=de&gl=DE&ceid=DE:de', 'rss', 3);
