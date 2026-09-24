import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**',
    'src/app/client/layout/app-title.tsx',
    'src/tanstack-table.d.ts',
  ],
}

export default config