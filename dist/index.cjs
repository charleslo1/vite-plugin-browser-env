"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => browserEnvPlugin
});
module.exports = __toCommonJS(src_exports);
var import_vite = require("vite");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_chalk = __toESM(require("chalk"), 1);
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
    const envs = (0, import_vite.loadEnv)(mode, process.cwd(), prefix || "");
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
    const scriptTag = `<script src="${import_path.default.join(config.base, fileName)}"></script>`;
    return html.includes(fileName) ? html : html.replace("</head>", `${scriptTag}
</head>`);
  }
  function logEnvInfo() {
    console.log(import_chalk.default.cyan("\n\u2728 [vite-plugin-browser-env] - Collected environment variables:"));
    Object.entries(env).forEach(([key, value]) => {
      console.log(import_chalk.default.green(`  ${key}: ${value}`));
    });
    console.log(import_chalk.default.cyan(`Total variables: ${Object.keys(env).length}
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
        if (req.url === import_path.default.join(config.base, fileName)) {
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
      const jsPath = import_path.default.resolve(outputDir, fileName);
      import_fs.default.writeFileSync(jsPath, generateEnvScript());
      Object.keys(bundle).filter((fileName2) => fileName2.endsWith(".html")).forEach((htmlFileName) => {
        const htmlPath = import_path.default.resolve(outputDir, htmlFileName);
        const htmlContent = import_fs.default.readFileSync(htmlPath, "utf-8");
        import_fs.default.writeFileSync(htmlPath, injectScriptTag(htmlContent));
      });
    }
  };
}
