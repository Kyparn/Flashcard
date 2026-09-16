process.env.HOST = "0.0.0.0";
const { createQuizServer } = require("./index.cjs");
const { networkInterfaces } = require("node:os");
const port = Number(process.env.PORT) || 3001;
createQuizServer()
  .then((server) =>
    server.listen(port, "0.0.0.0", () => {
      console.log(`Local quiz: http://localhost:${port}`);
      for (const entries of Object.values(networkInterfaces())) {
        for (const info of entries)
          if (info.family === "IPv4" && !info.internal)
            console.log(`Mobile address: http://${info.address}:${port}`);
      }
    }),
  )
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
