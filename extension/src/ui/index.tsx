import { createRoot } from 'react-dom/client';
import { NetlifyExtensionUI } from '@netlify/sdk/ui/react/components';
import '@netlify/sdk/ui/react/core.css';
import { App } from './App.js';

const rootNodeId = 'root';
let rootNode = document.getElementById(rootNodeId);
if (rootNode === null) {
  rootNode = document.createElement('div');
  rootNode.id = rootNodeId;
}
const root = createRoot(rootNode);

root.render(
  <NetlifyExtensionUI>
    <App />
  </NetlifyExtensionUI>
);
