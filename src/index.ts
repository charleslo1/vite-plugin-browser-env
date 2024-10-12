import { Plugin, ResolvedConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// 定义插件选项接口
export interface BrowserEnvOptions {
  prefix?: string | false; // 环境变量前缀
  envObjectName?: string;  // 注入到 window 对象上的属性名
  fileName?: string;       // 生成的环境配置文件名
  includes?: string[];     // 总是包含的环境变量名列表
  excludes?: string[];     // 总是排除的环境变量名列表
}

/**
 * 创建一个用于处理环境变量的 Vite 插件
 * @param options 插件配置选项
 * @returns Vite 插件
 */
export default function browserEnvPlugin(options: BrowserEnvOptions = {}): Plugin {
  const {
    prefix = 'VITE_',
    envObjectName = 'env',
    fileName = 'env-config.js',
    includes = [],
    excludes = []
  } = options;

  let env: Record<string, string> = {};
  let config: ResolvedConfig;

  // 收集环境变量
  function collectEnvVariables(): void {
    env = Object.entries(process.env)
      .filter(([key]) =>
        includes.includes(key) ||
        (prefix !== false && !excludes.includes(key) && key.startsWith(prefix as string))
      )
      .reduce((acc, [key, value]) => {
        acc[key] = value || '';
        return acc;
      }, {} as Record<string, string>);
  }

  // 生成环境变量脚本内容
  function generateEnvScript(): string {
    return `window.${envObjectName} = ${JSON.stringify(env, null, 2)};`;
  }

  // 注入脚本标签到 HTML
  function injectScriptTag(html: string): string {
    const scriptTag = `<script src="${path.join(config.base, fileName)}"></script>`;
    return html.includes(fileName) ? html : html.replace('</head>', `${scriptTag}\n</head>`);
  }

  return {
    name: 'generate-env',

    // 配置解析完成后的钩子
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
      collectEnvVariables();
    },

    // 配置开发服务器
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === path.join(config.base, fileName)) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(generateEnvScript());
        } else {
          next();
        }
      });
    },

    // 转换 HTML 内容
    transformIndexHtml(html: string) {
      return injectScriptTag(html);
    },

    // 构建完成后的钩子
    async writeBundle(options, bundle) {
      const outputDir = options.dir || '';
      const jsPath = path.resolve(outputDir, fileName);
      fs.writeFileSync(jsPath, generateEnvScript());

      // 处理所有 HTML 文件
      Object.keys(bundle)
        .filter(fileName => fileName.endsWith('.html'))
        .forEach(htmlFileName => {
          const htmlPath = path.resolve(outputDir, htmlFileName);
          const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
          fs.writeFileSync(htmlPath, injectScriptTag(htmlContent));
        });
    }
  };
}
