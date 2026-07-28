import validate from '../src/lib/generated/game-data-pack-v2-validator.js';

const pack = {
  format: 'game-data-pack',
  formatVersion: 2,
  id: 'mod.esm-smoke',
  mergeMode: 'alongside',
  provenance: {
    sourceSnapshotIds: ['fixture:esm'],
    inputSha256: 'a'.repeat(64),
    validatorVersion: 'pack-v2',
    outputSha256: 'b'.repeat(64),
  },
};

if (!validate(pack)) {
  process.stderr.write(JSON.stringify(validate.errors));
  process.exit(1);
}
process.stdout.write('[validator-esm] PASS\n');
