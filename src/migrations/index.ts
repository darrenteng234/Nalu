import * as migration_20260907_143903_initial from './20260907_143903_initial';
import * as migration_20260908_061910_phase4_commercial from './20260908_061910_phase4_commercial';

export const migrations = [
  {
    up: migration_20260907_143903_initial.up,
    down: migration_20260907_143903_initial.down,
    name: '20260907_143903_initial',
  },
  {
    up: migration_20260908_061910_phase4_commercial.up,
    down: migration_20260908_061910_phase4_commercial.down,
    name: '20260908_061910_phase4_commercial'
  },
];
