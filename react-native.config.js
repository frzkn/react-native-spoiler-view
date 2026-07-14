module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath:
          'import com.reactnativespoilerview.SpoilerViewPackage;',
        packageInstance: 'new SpoilerViewPackage()',
      },
      ios: {},
    },
  },
};
