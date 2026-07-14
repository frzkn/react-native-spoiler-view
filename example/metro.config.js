const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const peerModules = [
  'react',
  'react-native',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-worklets',
];

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const peerModule = peerModules.find(
        name => moduleName === name || moduleName.startsWith(`${name}/`),
      );

      if (peerModule) {
        const peerPath = path.resolve(projectRoot, 'node_modules', peerModule);
        const subpath = moduleName.slice(peerModule.length);

        return context.resolveRequest(
          context,
          `${peerPath}${subpath}`,
          platform,
        );
      }

      return context.resolveRequest(context, moduleName, platform);
    },
    extraNodeModules: Object.fromEntries(
      peerModules.map(moduleName => [
        moduleName,
        path.resolve(projectRoot, 'node_modules', moduleName),
      ]),
    ),
    nodeModulesPaths: [path.resolve(projectRoot, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
