# Example app

This bare React Native application is the iOS and Android integration harness
for `react-native-spoiler-view`.

```bash
npm install
cd ios && pod install && cd ..
npm start
```

Run `npm run ios` or `npm run android` in another terminal. Run `npm run check`
to type-check, lint, and produce release JavaScript bundles for both platforms.
The example reserves Metro port 8082 so it can run beside another React Native app.

The app covers controlled and uncontrolled state, hidden interactive children,
accessibility labels, Arabic/RTL content, dark mode, and multiple simultaneously
mounted spoilers.
