// src/index.ts
import { loadEnv } from "vite";
import fs from "fs";
import path from "path";
import chalk from "chalk";
function browserEnvPlugin(options = {}) {
  const {
    prefix = "VITE_",
    envObjectName = "env",
    fileName = "env-config.js",
    includes = [],
    excludes = []
  } = options;
  let env = {};
  let config;
  function collectEnvVariables(mode) {
    const envs = loadEnv(mode, process.cwd(), prefix || "");
    env = Object.entries(envs).filter(
      ([key]) => includes.includes(key) || prefix !== false && !excludes.includes(key) && (prefix === "" || key.startsWith(prefix))
    ).reduce((acc, [key, value]) => {
      acc[key] = value || "";
      return acc;
    }, {});
  }
  function generateEnvScript() {
    return `window.${envObjectName} = ${JSON.stringify(env, null, 2)};`;
  }
  function injectScriptTag(html) {
    const scriptTag = `<script src="${path.join(config.base, fileName)}"></script>`;
    return html.includes(fileName) ? html : html.replace("</head>", `${scriptTag}
</head>`);
  }
  function logEnvInfo() {
    console.log(chalk.cyan("\n\u2728 [vite-plugin-browser-env] - Collected environment variables:"));
    Object.entries(env).forEach(([key, value]) => {
      console.log(chalk.green(`  ${key}: ${value}`));
    });
    console.log(chalk.cyan(`Total variables: ${Object.keys(env).length}
`));
  }
  return {
    name: "vite-plugin-browser-env",
    // 配置解析完成后的钩子
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      collectEnvVariables(config.mode);
      logEnvInfo();
    },
    // 配置开发服务器
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === path.join(config.base, fileName)) {
          res.setHeader("Content-Type", "application/javascript");
          res.end(generateEnvScript());
        } else {
          next();
        }
      });
    },
    // 转换 HTML 内容
    transformIndexHtml(html) {
      return injectScriptTag(html);
    },
    // 构建完成后的钩子
    async writeBundle(options2, bundle) {
      const outputDir = options2.dir || "";
      const jsPath = path.resolve(outputDir, fileName);
      fs.writeFileSync(jsPath, generateEnvScript());
      Object.keys(bundle).filter((fileName2) => fileName2.endsWith(".html")).forEach((htmlFileName) => {
        const htmlPath = path.resolve(outputDir, htmlFileName);
        const htmlContent = fs.readFileSync(htmlPath, "utf-8");
        fs.writeFileSync(htmlPath, injectScriptTag(htmlContent));
      });
    }
  };
}
export {
  browserEnvPlugin as default
};
