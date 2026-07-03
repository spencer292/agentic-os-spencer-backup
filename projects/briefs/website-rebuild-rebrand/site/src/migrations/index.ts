import * as migration_20260406_151306 from './20260406_151306';
import * as migration_20260415_134051_teamcards_block from './20260415_134051_teamcards_block';
import * as migration_20260421_082108_urlpattern_field from './20260421_082108_urlpattern_field';
import * as migration_20260424_rbac_user_role from './20260424_rbac_user_role';
import * as migration_20260522_104250_table_and_tldr_blocks from './20260522_104250_table_and_tldr_blocks';

export const migrations = [
  {
    up: migration_20260406_151306.up,
    down: migration_20260406_151306.down,
    name: '20260406_151306',
  },
  {
    up: migration_20260415_134051_teamcards_block.up,
    down: migration_20260415_134051_teamcards_block.down,
    name: '20260415_134051_teamcards_block',
  },
  {
    up: migration_20260421_082108_urlpattern_field.up,
    down: migration_20260421_082108_urlpattern_field.down,
    name: '20260421_082108_urlpattern_field',
  },
  {
    up: migration_20260424_rbac_user_role.up,
    down: migration_20260424_rbac_user_role.down,
    name: '20260424_rbac_user_role',
  },
  {
    up: migration_20260522_104250_table_and_tldr_blocks.up,
    down: migration_20260522_104250_table_and_tldr_blocks.down,
    name: '20260522_104250_table_and_tldr_blocks'
  },
];
