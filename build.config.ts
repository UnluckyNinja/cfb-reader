import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: 'node16',
  clean: true,

  rollup: {
    emitCJS: true,
    esbuild: {
      target: 'es2021', // will contain decorator metadata
    },
  },
})
