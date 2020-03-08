import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

const extensions = [".ts", ".js"];

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "umd",
    sourcemap: true
  },
  plugins: [
    resolve({
      extensions
    }),
    typescript({
      tsconfigDefaults: {
        compilerOptions: { declaration: true }
      }
    })
  ]
};
