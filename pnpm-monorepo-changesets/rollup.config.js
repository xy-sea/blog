import fs from 'fs';
import path from 'path';
import typescript from 'rollup-plugin-typescript2';
const packagesDir = path.resolve(__dirname, 'packages');
const packageFiles = fs.readdirSync(packagesDir);
function output(path) {
  return [
    {
      input: [`./packages/${path}/src/index.ts`],
      output: [
        {
          file: `./packages/${path}/dist/index.js`,
          format: 'umd',
          name: 'web-see',
          sourcemap: true
        }
      ],
      plugins: [
        typescript({
          tsconfigOverride: {
            compilerOptions: {
              module: 'ESNext'
            }
          },
          useTsconfigDeclarationDir: true
        })
      ]
    }
  ];
}

export default [...packageFiles.map((path) => output(path)).flat()];
