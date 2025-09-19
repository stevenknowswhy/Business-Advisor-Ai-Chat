// Minimal Convex server shim for unit tests
export type ActionCtx = any;

export const action = (def: any) => ({ handler: def.handler });
export const mutation = (def: any) => ({ handler: def.handler });
export const internalMutation = (def: any) => ({ handler: def.handler });
export const query = (def: any) => ({ handler: def.handler });
export const internalQuery = (def: any) => ({ handler: def.handler });

