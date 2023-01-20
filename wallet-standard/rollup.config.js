const nodeResolve = require("@rollup/plugin-node-resolve")
const typescript = require("@rollup/plugin-typescript")
const replace = require("@rollup/plugin-replace")
const commonjs = require("@rollup/plugin-commonjs")

const env = process.env.NODE_ENV;

module.exports = {
  input: "src/index.ts",
  plugins: [
    commonjs(),
    nodeResolve({
      browser: true,
      extensions: [".js", ".ts"],
      // dedupe: ["bn.js", "buffer"],
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: "./tsconfig.base.json",
      moduleResolution: "node",
      outDir: "types",
      target: "ESNext",
      outputToFilesystem: false,
    }),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify(env),
        // "process.env.ANCHOR_BROWSER": JSON.stringify(true),
      },
    }),
  ],
  external: [
    "@solana/wallet-standard-features",
    "@wallet-standard/base",
    "@solana/web3.js",
    "@wallet-standard/features",
    "bs58",
  ],
  output: {
    file: "dist/browser/index.js",
    format: "cjs",
    sourcemap: true,
  },
};
