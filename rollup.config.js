import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

const extensions = [".ts", ".js"];

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "es"
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs"
    }
  ],
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
