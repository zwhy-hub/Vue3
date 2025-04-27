/**
 *打包开发环境
 *
 * node scripts/dev.js    -format cjs
 */

// process.argv;
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import esbuild from 'esbuild'
import { createRequire } from 'node:module'
/**
 * @description 解析命令行参数
 */
const {
  values: { format },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})

//创建esm得__filename
const __filename = fileURLToPath(import.meta.url)
//创建esm得__dirname
const __dirname = dirname(__filename)

const require = createRequire(import.meta.url)
const target = positionals.length ? positionals[0] : 'vue'
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
/**
 *
 * @type {string}
 */
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
)

const pkg = require(`../packages/${target}/package.json`)
// console.log('pkg', pkg)

esbuild
  .context({
    entryPoints: [entry], //入口文件
    outfile, //输出文件
    format, //打包格式cjs,esm,iife
    platform: format === 'cjs' ? 'node' : 'browser', //打包平台
    sourcemap: true, //开启sourcemap 方便调试
    bundle: true, //打包所有依赖到一个文件中
    globalName: pkg.buildOptions.name, //全局变量名
  })
  .then(ctx => ctx.watch())
