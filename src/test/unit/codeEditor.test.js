// Mock for code parser testing.
// In reality, CodeParser would be in src/CodeParser.js
const parseJSX = (code) => {
  if (code.includes('<mesh>') && code.includes('</mesh>')) {
      return { type: 'mesh' };
  }
  throw new Error('Invalid JSX');
};

describe('Code Editor Parser', () => {
  test('should parse valid R3F JSX', () => {
    const jsx = '<mesh><boxGeometry /></mesh>';
    const result = parseJSX(jsx);
    expect(result).toBeDefined();
    expect(result.type).toBe('mesh');
  });

  test('should throw on invalid JSX', () => {
    const jsx = '<mesh><boxGeometry />'; // unclosed
    expect(() => parseJSX(jsx)).toThrow();
  });
});
