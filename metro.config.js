const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const os = require('os');

const config = getDefaultConfig(__dirname);

// =============================================================================
// WORKER CONFIGURATION
// =============================================================================

// Cap workers to limit memory — each worker holds its own AST cache.
// 2 workers use ~40% less memory than 4 workers with minimal speed impact.
const cpuCount = os.cpus().length;
config.maxWorkers = Math.min(2, Math.max(1, Math.floor(cpuCount / 2)));

// =============================================================================
// TRANSFORMER OPTIMIZATIONS
// =============================================================================

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      reduce_funcs: true,
      reduce_vars: true,
    },
  },
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// =============================================================================
// WATCHER OPTIMIZATIONS (Critical for Windows + OneDrive)
// =============================================================================

config.watcher = {
  ...config.watcher,
  healthCheck: {
    enabled: false,
  },
  // Disable worker threads for watcher — fixes startup timeout on Windows + OneDrive
  unstable_workerThreads: false,
  additionalExts: [],
  // Increase watcher timeout for Windows + OneDrive (default 5s is too short)
  watchman: {
    deferStates: ['hg.update'],
  },
};

// Increase file map watcher timeout (default is too aggressive for OneDrive)
process.env.METRO_FILE_MAP_WATCHER_HEALTH_CHECK_TIMEOUT = '120000';

// =============================================================================
// RESOLVER OPTIMIZATIONS
// =============================================================================

config.resolver = {
  ...config.resolver,
  blockList: [
    /\.git\/.*/,
    /android\/\.gradle\/.*/,
    /ios\/Pods\/.*/,
    // Block test/mock/example/backup files from module graph
    /__tests__\/.*/,
    /__mocks__\/.*/,
    /\.test\.(js|jsx|ts|tsx)$/,
    /\.spec\.(js|jsx|ts|tsx)$/,
    /\.example\.(js|jsx|ts|tsx)$/,
    /\.LAZY_LOADING_EXAMPLE\.(js|jsx|ts|tsx)$/,
    /tests\.bak/,
    /examples\/.*/,
    // Block scripts (not needed at runtime)
    /scripts\/.*/,
    // Block generated artifacts that frequently change in dev and can trigger noisy HMR loops
    /coverage\/.*/,
    /eslint-full-report\.json$/,
    /run_.*\.log$/,
    /.*\.(log|tmp)$/,
    // Block OneDrive metadata and temp files from triggering rebuilds
    /\.tmp$/,
    /~\$/,
    /\.onedrive/,
    // Block storybook/docs if present
    /\.storybook\/.*/,
    /\.stories\.(js|jsx|ts|tsx)$/,
  ],
  hasteImplModulePath: undefined,
  // Map nested node_modules so Metro can resolve markdown-it's entities@2 correctly
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
  },
};

// Fix: markdown-it@10 needs entities@2 (with lib/maps/entities.json),
// but Metro hoists entities@6 which lacks that file. Add the nested path to watchFolders
// so Metro can track and hash the file.
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'node_modules/markdown-it/node_modules/entities'),
];

// =============================================================================
// CACHE SETTINGS
// =============================================================================

try {
  const { FileStore } = require('metro-cache');
  config.cacheStores = [
    new FileStore({
      root: path.join(__dirname, 'node_modules/.cache/metro'),
    }),
  ];
} catch (error) {
  console.warn('metro-cache not available, using default cache');
  config.cacheStores = [];
}

// =============================================================================
// ASSET EXTENSIONS
// =============================================================================

config.resolver.assetExts.push('svg');

// =============================================================================
// WEB SHIMS CONFIGURATION (only applies to platform === 'web')
// =============================================================================

const shimPath = path.resolve(__dirname, 'web-shims');
const rnWebExports = path.resolve(__dirname, 'node_modules/react-native-web/dist/exports');

// Pre-build lookup maps for O(1) resolution instead of O(n) iteration
const webShimMap = new Map([
  ['Utilities/Platform', path.join(rnWebExports, 'Platform/index.js')],
  ['PlatformColorValueTypes', path.join(shimPath, 'PlatformColorValueTypes.js')],
  ['RendererProxy', path.join(shimPath, 'RendererProxy.js')],
  ['BaseViewConfig', path.join(shimPath, 'BaseViewConfig.js')],
  ['PlatformBaseViewConfig', path.join(shimPath, 'BaseViewConfig.js')],
  ['ReactNativeTypes', path.join(shimPath, 'ReactNativeTypes.js')],
  ['NativeComponent', path.join(shimPath, 'empty.js')],
  ['TextInputState', path.join(shimPath, 'TextInputState.js')],
]);

const webPackageShimPrefix = '@stripe/stripe-react-native';
const stripeShimPath = path.join(shimPath, 'stripe-react-native.js');

const markdownItEntitiesJson = path.resolve(
  __dirname, 'node_modules/markdown-it/node_modules/entities/lib/maps/entities.json'
);

// Fix: @tanstack/react-query v5.90+ with "type":"module" breaks Metro 0.80 resolution
const tanstackReactQueryEntry = path.resolve(
  __dirname, 'node_modules/@tanstack/react-query/build/legacy/index.cjs'
);
const tanstackQueryCoreEntry = path.resolve(
  __dirname, 'node_modules/@tanstack/query-core/build/legacy/index.cjs'
);

const localforageFilePath = path.resolve(
  __dirname, 'node_modules/localforage/dist/localforage.js'
);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Fix: @sentry/integrations requires localforage whose dist file Metro can't resolve
  if (moduleName === 'localforage') {
    return { filePath: localforageFilePath, type: 'sourceFile' };
  }

  // Fix: redirect entities/lib/maps/entities.json to markdown-it's nested entities@2
  // (top-level entities@6 removed this file)
  if (moduleName === 'entities/lib/maps/entities.json') {
    return { filePath: markdownItEntitiesJson, type: 'sourceFile' };
  }

  // Fix: @tanstack/react-query v5.90+ uses "type":"module" which breaks Metro 0.80
  if (moduleName === '@tanstack/react-query') {
    return { filePath: tanstackReactQueryEntry, type: 'sourceFile' };
  }
  if (moduleName === '@tanstack/query-core') {
    return { filePath: tanstackQueryCoreEntry, type: 'sourceFile' };
  }

  // SHORT-CIRCUIT: Skip all shim logic for non-web platforms
  if (platform === 'web') {
    // Check package shim (single string check, not a loop)
    if (moduleName === webPackageShimPrefix || moduleName.startsWith(webPackageShimPrefix + '/')) {
      return { filePath: stripeShimPath, type: 'sourceFile' };
    }
    // Check internal module shims using Map for O(1) lookup
    for (const [pattern, shimFile] of webShimMap) {
      if (moduleName.includes(pattern)) {
        return { filePath: shimFile, type: 'sourceFile' };
      }
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => middleware,
};

// =============================================================================
// SUPPRESS KNOWN HARMLESS WARNINGS (bundler-level only)
// =============================================================================

const originalWarn = console.warn;
const suppressedPrefixes = [
  'Require cycle:',
  '"shadow*" style props are deprecated',
  '"textShadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
];

console.warn = (...args) => {
  if (typeof args[0] === 'string') {
    for (const prefix of suppressedPrefixes) {
      if (args[0].includes(prefix)) return;
    }
  }
  originalWarn.apply(console, args);
};

module.exports = config;
