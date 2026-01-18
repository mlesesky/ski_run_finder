const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'data', 'whistler_blackcomb', 'graph.json');
if (!fs.existsSync(p)) {
  console.error('graph.json not found at', p);
  process.exit(2);
}
const g = JSON.parse(fs.readFileSync(p, 'utf8'));
const nodes = new Map(g.nodes.map(n => [n.id, { ...n, in: 0, out: 0 }]));
const missing = new Set();
let edgesWithMissing = 0;
for (const e of g.edges) {
  if (e.from) {
    if (nodes.has(e.from)) nodes.get(e.from).out++;
    else { missing.add(e.from); edgesWithMissing++; }
  }
  if (e.to) {
    if (nodes.has(e.to)) nodes.get(e.to).in++;
    else { missing.add(e.to); edgesWithMissing++; }
  }
}
const isolated = [];
const onlyIn = [];
const onlyOut = [];
for (const [id, n] of nodes.entries()) {
  const deg = n.in + n.out;
  if (deg === 0) isolated.push(id);
  else if (n.in > 0 && n.out === 0) onlyIn.push(id);
  else if (n.out > 0 && n.in === 0) onlyOut.push(id);
}
console.log('nodes:', nodes.size);
console.log('edges:', g.edges.length);
console.log('edges referencing missing node ids:', edgesWithMissing);
if (missing.size) console.log('missing node ids referenced:', Array.from(missing).join(', '));
console.log('isolated nodes (degree 0):', isolated.length ? isolated.join(', ') : '(none)');
console.log('nodes with only incoming edges (sinks):', onlyIn.length ? onlyIn.join(', ') : '(none)');
console.log('nodes with only outgoing edges (sources):', onlyOut.length ? onlyOut.join(', ') : '(none)');
// print top 10 by degree
const byDeg = Array.from(nodes.entries()).map(([id,n])=>({id,deg:n.in+n.out,in:n.in,out:n.out})).sort((a,b)=>b.deg-a.deg);
console.log('\nTop 10 nodes by degree:');
byDeg.slice(0,10).forEach(n=>console.log(`${n.id}: deg=${n.deg} (in=${n.in} out=${n.out})`));
