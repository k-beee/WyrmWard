#!/usr/bin/env node
import { createClient } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studioDevnet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';

const address = process.argv[2] || process.env.CONTRACT_ADDRESS;
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) {
  console.error('Usage: node scripts/inspect_covenant.mjs <0xContractAddress>');
  console.error('Or: CONTRACT_ADDRESS=0x... node scripts/inspect_covenant.mjs');
  process.exit(1);
}

const chain = {
  ...studioDevnet,
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } },
};

const client = createClient({ chain });
const read = (name, args = []) =>
  client.readContract({
    address,
    functionName: name,
    args,
    stateStatus: 'finalized',
    jsonSafeReturn: true,
  });

console.log('Inspecting WyrmWard at:', address);
const meta = await read('get_protocol_metadata');
console.log('Protocol Metadata:', JSON.stringify(meta, null, 2));

const telemetry = await read('get_protocol_telemetry');
console.log('Telemetry Counts:', JSON.stringify(telemetry));

for (let i = 1; i <= Number(telemetry.covenants); i++) {
  console.log(`Covenant #${i}:`, JSON.stringify(await read('get_covenant', [i]), null, 2));
}

for (let i = 1; i <= Number(telemetry.codicils); i++) {
  console.log(`Codicil #${i}:`, JSON.stringify(await read('get_codicil', [i]), null, 2));
}

for (let i = 1; i <= Number(telemetry.verdicts); i++) {
  console.log(`Verdict #${i}:`, JSON.stringify(await read('get_verdict', [i]), null, 2));
}
