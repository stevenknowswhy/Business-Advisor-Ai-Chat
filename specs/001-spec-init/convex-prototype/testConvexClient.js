(async ()=>{
  try {
    const p='file:///Users/stephenstokes/Downloads/Projects/9 September 2025/Ai Advisor App/specs/001-spec-init/convex-prototype/convex/node_modules/convex/dist/esm/browser/http_client.js';
    const mod = await import(p);
    console.log('keys:', Object.keys(mod).slice(0,40));
    const ConvexHttpClient = mod.ConvexHttpClient || mod.default?.ConvexHttpClient;
    console.log('ConvexHttpClient?', !!ConvexHttpClient);
    if (ConvexHttpClient) {
      const c = new ConvexHttpClient('https://striped-gnat-509.convex.cloud', { auth: 'dev:striped-gnat-509|eyJ2MiI6ImJhNTUzY2FhMWZhMTRjNGJhNTg2OTc0YzQ5NDkzODQyIn0=' });
      console.log('methods:', typeof c.mutation, typeof c.action, typeof c.query);
    }
  } catch(e){
    console.error('err', e.message||e);
  }
})();
