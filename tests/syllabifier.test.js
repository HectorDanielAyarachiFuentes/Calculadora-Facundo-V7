import { Syllabifier } from '../js/modal/bostraplectornumeros.js';

describe('Syllabifier', () => {
    test('should separate syllables for 30602400 correctly without isolating initial consonants or breaking digraphs', () => {
        expect(Syllabifier.syllabify('treinta')).toEqual(['trein', 'ta']);
        expect(Syllabifier.syllabify('millones')).toEqual(['mi', 'llo', 'nes']);
        expect(Syllabifier.syllabify('seiscientos')).toEqual(['seis', 'cien', 'tos']);
        expect(Syllabifier.syllabify('dos')).toEqual(['dos']);
        expect(Syllabifier.syllabify('mil')).toEqual(['mil']);
        expect(Syllabifier.syllabify('cuatrocientos')).toEqual(['cua', 'tro', 'cien', 'tos']);
    });

    test('should respect digraphs ch, ll, rr and mute u in qu/gu', () => {
        expect(Syllabifier.syllabify('ocho')).toEqual(['o', 'cho']);
        expect(Syllabifier.syllabify('ochocientos')).toEqual(['o', 'cho', 'cien', 'tos']);
        expect(Syllabifier.syllabify('arroz')).toEqual(['a', 'rroz']);
        expect(Syllabifier.syllabify('quince')).toEqual(['quin', 'ce']);
        expect(Syllabifier.syllabify('quinientos')).toEqual(['qui', 'nien', 'tos']);
        expect(Syllabifier.syllabify('guerra')).toEqual(['gue', 'rra']);
    });

    test('should respect inseparable consonant clusters (muta cum liquida)', () => {
        expect(Syllabifier.syllabify('tres')).toEqual(['tres']);
        expect(Syllabifier.syllabify('cuatro')).toEqual(['cua', 'tro']);
        expect(Syllabifier.syllabify('veintitrés')).toEqual(['vein', 'ti', 'trés']);
        expect(Syllabifier.syllabify('blanco')).toEqual(['blan', 'co']);
    });

    test('should handle diphthongs and hiatus correctly according to RAE', () => {
        expect(Syllabifier.syllabify('veintiuno')).toEqual(['vein', 'tiu', 'no']);
        expect(Syllabifier.syllabify('veintiún')).toEqual(['vein', 'tiún']);
        expect(Syllabifier.syllabify('dieciocho')).toEqual(['die', 'cio', 'cho']);
        expect(Syllabifier.syllabify('poeta')).toEqual(['po', 'e', 'ta']);
        expect(Syllabifier.syllabify('caída')).toEqual(['ca', 'í', 'da']);
        expect(Syllabifier.syllabify('día')).toEqual(['dí', 'a']);
    });

    test('should handle single letter words and compound decimal numbers', () => {
        expect(Syllabifier.syllabify('y')).toEqual(['y']);
        expect(Syllabifier.syllabify('diezmilésimos')).toEqual(['diez', 'mi', 'lé', 'si', 'mos']);
        expect(Syllabifier.syllabify('cienmilésimos')).toEqual(['cien', 'mi', 'lé', 'si', 'mos']);
    });
});
