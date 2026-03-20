import { describe, it, expect } from 'vitest';
describe('Object search filter', () => {
    it('filters objects by name', () => {
        const objects = [{name: 'Cube'}, {name: 'Sphere'}];
        const filtered = objects.filter(o => o.name.toLowerCase().includes('cu'));
        expect(filtered.length).toBe(1);
    });
});
