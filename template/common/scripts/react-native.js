if (
  process.argv.includes('run-ios') && !process.argv.includes('--simulator')
) {
  process.argv.push('--simulator');
  process.argv.push('iPhone 11'); // Set Default simulator
}

require('@react-native-community/cli').run();
