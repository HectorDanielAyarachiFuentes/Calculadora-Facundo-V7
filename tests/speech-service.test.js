
import { jest } from '@jest/globals';
import { SpeechService } from '../js/modal/bostraplectornumeros.js';

describe('SpeechService', () => {
    beforeEach(() => {
        SpeechService.playbackRate = 1.0;
        delete window.speechSynthesis;
    });

    test('should have default rate 1.0', () => {
        expect(SpeechService.playbackRate).toBe(1.0);
    });

    test('setSpeed should update playback rate', () => {
        SpeechService.setSpeed(0.8);
        expect(SpeechService.playbackRate).toBe(0.8);
        SpeechService.setSpeed('1.25');
        expect(SpeechService.playbackRate).toBe(1.25);
    });

    test('speak should call onEndCallback when speechSynthesis is undefined', () => {
        const onEnd = jest.fn();
        SpeechService.speak('Hola', 'es-ES', null, onEnd);
        expect(onEnd).toHaveBeenCalled();
    });

    test('speak should call window.speechSynthesis.speak with configured rate', () => {
        const mockSpeak = jest.fn();
        const mockCancel = jest.fn();
        window.speechSynthesis = {
            speak: mockSpeak,
            cancel: mockCancel
        };
        global.SpeechSynthesisUtterance = function(text) {
            this.text = text;
            this.lang = '';
            this.rate = 1;
        };

        SpeechService.setSpeed(1.25);
        SpeechService.speak('Prueba');

        expect(mockCancel).toHaveBeenCalled();
        expect(mockSpeak).toHaveBeenCalled();
        const utteranceArg = mockSpeak.mock.calls[0][0];
        expect(utteranceArg.rate).toBe(1.25);
        expect(utteranceArg.text).toBe('Prueba');
    });
});
