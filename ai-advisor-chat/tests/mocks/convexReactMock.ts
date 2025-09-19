// Minimal mock for convex/react hooks used in unit tests
export const useQuery = jest.fn(() => undefined);
export const useMutation = jest.fn(() => jest.fn());
export const useAction = jest.fn(() => jest.fn(async () => ({})));

export default { useQuery, useMutation, useAction } as any;

