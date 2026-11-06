/**
 * Extração por regras (sem LLM, custo zero de tokens): decide se a notícia trata de
 * queda de aeronave tripulada e tenta tirar local, vítimas, modelo e data.
 */

const AIRCRAFT =
  /\b(planes?|airplanes?|aircraft|airliner|jet|helicopters?|chopper|seaplane|glider|gyrocopter|ultralight|hot[- ]air balloon|cessna|piper|beechcraft|embraer|boeing|airbus|bombardier|cirrus|robinson|avi[aã]o|avi[oõ]es|aeronaves?|helic[oó]ptero|monomotor|bimotor|planador|ultraleve|avion|h[ée]licopt[èe]re|appareil|flugzeug|hubschrauber|kleinflugzeug|maschine)\b/i;

const CRASH =
  /\b(crash(?:es|ed|-lands?|-landed)?|went down|plunged|caiu|cai\b|queda|acidente a[ée]reo|desastre a[ée]reo|se acidentou|s'est [ée]cras[ée]|[ée]crasement|accident d'avion|abgest[üu]rzt|absturz|st[üu]rzt[e]? ab)/i;

/** Termos que indicam aeronave não tripulada ou assunto fora do escopo. */
const EXCLUDE =
  /\b(drones?|uavs?|unmanned|remotely piloted|model (?:aircraft|plane)|aeromodel\w*|vant|missiles?|rockets?|satellites?|foguete|m[íi]sseis?|m[íi]ssil|simulator|simulador|flight sim|stock|market crash|shot down|abatid[oa]s?|abgeschossen|drohnen?)\b/i;

export function isMannedCrash(text: string): boolean {
  return AIRCRAFT.test(text) && CRASH.test(text) && !EXCLUDE.test(text);
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  um: 1, uma: 1, dois: 2, duas: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

export function extractFatalities(text: string): number | undefined {
  const num = '(\\d{1,4}|' + Object.keys(NUMBER_WORDS).join('|') + ')';
  const patterns = [
    new RegExp(`\\b(?:kill(?:s|ed|ing)?|leaves?|left)\\s+(?:all\\s+)?${num}\\b`, 'i'),
    new RegExp(`\\b${num}\\s+(?:people\\s+|persons\\s+|passengers\\s+)?(?:killed|dead|die[sd]?|fatalities|mortos?|mortas?|morrem|morreram|v[íi]timas fatais|morts?|tote?)\\b`, 'i'),
    new RegExp(`\\b(?:mata|deixa)\\s+${num}\\b`, 'i'),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const v = m[1].toLowerCase();
      return NUMBER_WORDS[v] ?? Number(v);
    }
  }
  if (/\b(no (?:one|injuries)|sem feridos|ningu[ée]m (?:morreu|se feriu)|survive[ds]?|sobrevive\w*)\b/i.test(text)) return 0;
  return undefined;
}

const AIRCRAFT_MODEL =
  /\b((?:Cessna|Piper|Beechcraft|Beech|Embraer|Boeing|Airbus(?: Helicopters)?|Bombardier|Cirrus|Robinson|Bell|Sikorsky|Eurocopter|Diamond|Mooney|Pilatus|ATR|Antonov|Learjet|Gulfstream|Dassault|Textron|Tecnam|Let|De Havilland(?: Canada)?)[\s-]+[A-Z0-9][\w-]*(?:\s[A-Z0-9][\w-]*)?)/;

export function extractAircraft(text: string): string | undefined {
  return text.match(AIRCRAFT_MODEL)?.[1]?.trim();
}

const NAME_WORD = "[A-ZÀ-Ý][\\p{L}'’.-]*";
const CONNECTOR = '(?:\\s(?:de|do|da|dos|das|del|la|le|les|sur|am|im|upon|of)\\s|[\\s-])';
const PLACE = `${NAME_WORD}(?:${CONNECTOR}${NAME_WORD}){0,4}(?:,\\s*${NAME_WORD}(?:\\s${NAME_WORD}){0,3})?`;
const PREPOSITIONS = [
  'in', 'near', 'off', 'outside', 'over', 'into', 'at',
  'em', 'perto de', 'próximo a', 'próximo de', 'proximo a', 'no interior de', 'no', 'na',
  'à', 'près de', 'en', 'bei', 'nahe', 'nahe von',
];
const LOCATION_RE = new RegExp(`\\b(?:${PREPOSITIONS.join('|')})\\s+(?:the\\s+)?(${PLACE})`, 'gu');

const NOT_PLACES = new Set([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo',
  'the', 'a', 'an', 'o', 'os', 'as', 'um', 'uma', 'ntsb', 'faa', 'cenipa', 'bea', 'aaib', 'atsb', 'tsb', 'bfu',
  'reuters', 'ap', 'bbc', 'cessna', 'piper', 'boeing', 'airbus', 'embraer', 'beechcraft', 'robinson', 'bell',
  'brasil', 'brazil', 'video', 'vídeo', 'photos', 'fotos', 'live', 'update',
]);

/** Remove o sufixo " - Veículo" que o Google News acrescenta ao título. */
export function cleanTitle(title: string): string {
  return title.replace(/\s+[-–|]\s+[^-–|]{2,40}$/, '').trim();
}

/** Candidatos a local, do mais provável ao menos provável. */
export function extractLocations(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(LOCATION_RE)) {
    const place = m[1]!.replace(/[.,;:]+$/, '').trim();
    const first = place.split(/[\s,]/)[0]!.toLowerCase();
    if (NOT_PLACES.has(first) || NOT_PLACES.has(place.toLowerCase())) continue;
    if (!out.includes(place)) out.push(place);
  }
  return out;
}

/** Ajusta a data quando o texto diz "ontem" / "yesterday". */
export function extractOccurredAt(text: string, publishedAt: Date | undefined, now: Date): Date {
  const base = publishedAt && publishedAt.getTime() <= now.getTime() ? publishedAt : now;
  if (/\b(yesterday|ontem|hier|gestern)\b/i.test(text)) return new Date(base.getTime() - 24 * 3600_000);
  return base;
}
