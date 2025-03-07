import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([{
  entries: [{
    builder: 'rollup',
    input: 'src/index',
    name: 'cfb-reader',
  }],
  name: 'npm',
  declaration: 'node16',
  clean: true,

  rollup: {
    emitCJS: true,
    esbuild: {
      target: 'es2021', // will contain decorator metadata
    },
  },
}, {
  entries: [{
    builder: 'rollup',
    input: 'src/index',
    name: 'cfb-reader.browser',
  }],
  clean: true,
  name: 'browser',

  rollup: {
    emitCJS: true,
    inlineDependencies: ['binspector'],
    resolve: {
      browser: true,
    },
    esbuild: {
      target: 'es2021', // will contain decorator metadata
    },
  },
}])
