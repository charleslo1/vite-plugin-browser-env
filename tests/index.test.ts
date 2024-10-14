import { describe, it, expect } from 'vitest';
import browserEnvPlugin from '../src/index';
import { Plugin } from 'vite';

describe('browserEnvPlugin', () => {
  it('should create a plugin with default options', () => {
    const plugin = browserEnvPlugin();
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('generate-env');
  });

  it('should use custom options', () => {
    const options = {
      prefix: 'CUSTOM_',
      envObjectName: 'customEnv',
      fileName: 'custom-env.js',
      includes: ['NODE_ENV'],
      excludes: ['CUSTOM_SECRET'],
    };
    const plugin = browserEnvPlugin(options) as Plugin;
    expect(plugin).toBeDefined();

    // Mock process.env
    const originalEnv = process.env;
    process.env = {
      CUSTOM_API_URL: 'https://api.example.com',
      CUSTOM_SECRET: 'secret',
      NODE_ENV: 'test',
    };

    // Mock Vite's ResolvedConfig
    const mockConfig = {
      base: '/',
    };

    // Call configResolved hook
    plugin.configResolved?.(mockConfig as any);

    // Test transformIndexHtml
    const html = '<html><head></head><body></body></html>';
    const transformedHtml = plugin.transformIndexHtml?.(html);
    expect(transformedHtml).toContain('<script src="/custom-env.js"></script>');

    // Restore process.env
    process.env = originalEnv;
  });
});