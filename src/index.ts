import { NetlifyExtension } from '@netlify/sdk';

const extension = new NetlifyExtension();

// Inject serverless functions into user projects
extension.addFunctions('./src/functions', {
  prefix: 'aiwf',
  shouldInjectFunction: () => {
    // Always inject when the extension is installed
    return true;
  },
});

export { extension };
