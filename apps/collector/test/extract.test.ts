import { describe, expect, it } from 'vitest';
import {
  cleanTitle, extractAircraft, extractFatalities, extractLocations, extractOccurredAt, isMannedCrash,
} from '../src/extract.js';

describe('filtro de relevância', () => {
  it.each([
    'Small plane crashes near Austin, killing 2',
    'Helicopter crashed off the coast of Norway',
    'Avião de pequeno porte cai em Ubatuba e deixa dois mortos',
    'Queda de helicóptero em Minas Gerais',
    "Un avion de tourisme s'est écrasé près de Lyon",
    'Kleinflugzeug bei Stuttgart abgestürzt',
  ])('aceita queda de aeronave tripulada: %s', (t) => expect(isMannedCrash(t)).toBe(true));

  it.each([
    'Drone crashes into stadium during match',
    'Military drone crashed near the border',
    'Stock market crash hits airline shares',
    'Boeing reports quarterly earnings',
    'Missile shot down plane over sea',
    'Aeromodelo cai em praça de São Paulo',
  ])('rejeita: %s', (t) => expect(isMannedCrash(t)).toBe(false));
});

describe('extração', () => {
  it('encontra o local', () => {
    expect(extractLocations('Small plane crashes near Austin, Texas, killing 2')[0]).toBe('Austin, Texas');
    expect(extractLocations('Avião de pequeno porte cai em Ubatuba e deixa dois mortos')[0]).toBe('Ubatuba');
    expect(extractLocations('Helicopter crashed on Monday in Rio de Janeiro')[0]).toBe('Rio de Janeiro');
    expect(extractLocations("Un avion s'est écrasé près de Lyon")[0]).toBe('Lyon');
  });

  it('ignora palavras que não são lugares', () => {
    expect(extractLocations('Plane crashed in March, NTSB says')).toEqual([]);
  });

  it('extrai vítimas', () => {
    expect(extractFatalities('Small plane crashes, killing 2')).toBe(2);
    expect(extractFatalities('Crash leaves three dead')).toBe(3);
    expect(extractFatalities('Avião cai e deixa dois mortos')).toBe(2);
    expect(extractFatalities('Queda de avião mata 4')).toBe(4);
    expect(extractFatalities('Pilot survives crash')).toBe(0);
    expect(extractFatalities('Plane crashes in field')).toBeUndefined();
  });

  it('extrai modelo da aeronave', () => {
    expect(extractAircraft('A Cessna 172 crashed near Ocala')).toBe('Cessna 172');
    expect(extractAircraft('Robinson R44 helicopter went down')).toBe('Robinson R44');
  });

  it('limpa o sufixo do Google News', () => {
    expect(cleanTitle('Small plane crashes near Austin - Reuters')).toBe('Small plane crashes near Austin');
  });

  it('ajusta data para "ontem"', () => {
    const pub = new Date('2026-11-05T10:00:00Z');
    expect(extractOccurredAt('Plane crashed yesterday', pub, new Date('2026-11-05T12:00:00Z')).toISOString()).toBe(
      '2026-11-04T10:00:00.000Z',
    );
  });
});

describe('siglas e vítimas sem sobreviventes', () => {
  it('expande siglas de estado conforme o idioma', () => {
    expect(extractLocations('Helicóptero dos bombeiros caiu em MG')[0]).toBe('Minas Gerais, Brasil');
    expect(extractLocations('Queda de helicóptero em SC')[0]).toBe('Santa Catarina, Brasil');
    expect(extractLocations('Plane crashes near SC highway')[0]).toBe('South Carolina, USA');
    expect(extractLocations('Avião cai em Ubatuba, SP')[0]).toBe('Ubatuba, São Paulo, Brasil');
    expect(extractLocations('Plane crashed at LGA')).toEqual([]);
    expect(extractLocations('3 dead in news helicopter crash in LA')[0]).toBe('Los Angeles, California, USA');
    expect(extractLocations('Plane crashes in Lafayette, La.')[0]).toBe('Lafayette, Louisiana, USA');
  });

  it('usa o número a bordo quando não há sobreviventes', () => {
    expect(extractFatalities('Plane crashes with 6 aboard, no survivors')).toBe(6);
    expect(extractFatalities('Avião com quatro pessoas a bordo cai; não houve sobreviventes')).toBe(4);
    expect(extractFatalities('Queda de helicóptero: foram 6 mortes')).toBe(6);
    expect(extractFatalities('No one survived the crash')).toBeUndefined();
    expect(extractFatalities('Helicóptero que caiu e matou piloto em SC')).toBe(1);
    expect(extractFatalities('Queda de helicóptero que matou cantor Rick e outros 4 em SC')).toBe(5);
    expect(extractFatalities('Crash killed the pilot and 3 others')).toBe(4);
  });
});
