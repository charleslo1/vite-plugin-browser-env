import { Plugin } from 'vite';

interface BrowserEnvOptions {
    prefix?: string | false;
    envObjectName?: string;
    fileName?: string;
    includes?: string[];
    excludes?: string[];
}
/**
 * 创建一个用于处理环境变量的 Vite 插件
 * @param options 插件配置选项
 * @returns Vite 插件
 */
declare function browserEnvPlugin(options?: BrowserEnvOptions): Plugin;

export { BrowserEnvOptions, browserEnvPlugin as default };
