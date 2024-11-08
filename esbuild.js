const esbuild = require("esbuild");
const { exec } = require("child_process");

const external = [
  "@minecraft/server",
  "@minecraft/server-ui",
  "@minecraft/server-admin",
  "@minecraft/server-gametest",
  "@minecraft/server-net",
  "@minecraft/server-common",
  "@minecraft/server-editor",
  "@minecraft/debug-utilities",
];

esbuild
  .build({
    entryPoints: ["src/main.js"],
    outfile: "BP/scripts/main.js",
    bundle: true,
    minify: true,
    format: "esm",
    external,
  })
  .then(() => {
    console.log("Bundling finished!");

    // Command to execute copy.sh
    const command = `./copy.sh`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing copy: ${stderr}`);
        return;
      }
      console.log(`copy executed successfully: ${stdout}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
