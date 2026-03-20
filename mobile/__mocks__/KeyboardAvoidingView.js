// __mocks__/KeyboardAvoidingView.js
// Mock pass-through de KeyboardAvoidingView para component tests.
// Elimina la dependencia de Platform.OS que rompe el entorno jsdom.
const React = require('react');
const { View } = require('react-native');

const KeyboardAvoidingView = ({ children, style }) =>
  React.createElement(View, { style }, children);

module.exports = { default: KeyboardAvoidingView };
