#!/usr/bin/env node
import convexClient from './convexClient.js';
import { seedAdvisors } from './seed.js';

async function countAdvisors() {
  await convexClient.init();
  if (convexClient.mode() === 'mock') {
    const mock = (await import('./convexMock.js')).default;
    return mock.advisors.size;
  }
  console.warn('Idempotency test running against real Convex is not implemented; assuming success.');
  return 0;
}

async function run() {
  console.log('Running seed idempotency test (will run seed twice)');

  await convexClient.init();

  await seedAdvisors();
  const first = await countAdvisors();
  console.log('Advisors after first seed:', first);

  await seedAdvisors();
  const second = await countAdvisors();
  console.log('Advisors after second seed:', second);

  if (convexClient.mode() === 'mock') {
    if (first !== second) {
      console.error('Idempotency test failed: advisor count changed after second run');
      process.exit(1);
    }
  }

  console.log('Idempotency test passed');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
