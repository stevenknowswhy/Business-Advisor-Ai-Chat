// Minimal mock of convex/values validators sufficient for loading modules in tests
export const v = {
  string: () => 'string',
  boolean: () => 'boolean',
  number: () => 'number',
  float64: () => 'float64',
  id: (_: string) => 'id',
  object: (o: any) => o,
  optional: (x: any) => x,
  union: (...xs: any[]) => xs,
  array: (x: any) => [x],
  any: () => 'any',
} as any;
export default v;

