import { adjustedLikeCount } from '../engagement';

describe('adjustedLikeCount', () => {
    it('returns the server count when local and server state agree', () => {
        expect(adjustedLikeCount(5, false, false)).toBe(5);
        expect(adjustedLikeCount(5, true, true)).toBe(5);
    });

    it('adds one for a local like the server has not counted yet', () => {
        expect(adjustedLikeCount(5, false, true)).toBe(6);
        expect(adjustedLikeCount(0, false, true)).toBe(1);
        expect(adjustedLikeCount(undefined, false, true)).toBe(1);
    });

    it('subtracts one for a local un-like the server still counts', () => {
        expect(adjustedLikeCount(5, true, false)).toBe(4);
    });

    it('never goes below zero', () => {
        expect(adjustedLikeCount(0, true, false)).toBe(0);
        expect(adjustedLikeCount(undefined, true, false)).toBe(0);
    });

    it('treats undefined server flag as not liked', () => {
        expect(adjustedLikeCount(3, undefined, true)).toBe(4);
        expect(adjustedLikeCount(3, undefined, false)).toBe(3);
    });
});
