module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Transform import.meta to work in non-module context (fixes web crash)
      function () {
        return {
          visitor: {
            MetaProperty(path) {
              if (
                path.node.meta.name === 'import' &&
                path.node.property.name === 'meta'
              ) {
                if (
                  path.parent.type === 'MemberExpression' &&
                  path.parent.property.name === 'env'
                ) {
                  path.parentPath.replaceWithSourceString('process.env');
                } else {
                  path.replaceWithSourceString('({})');
                }
              }
            },
          },
        };
      },
      // Required for react-native-reanimated animations
      'react-native-reanimated/plugin',
    ],
  };
};
