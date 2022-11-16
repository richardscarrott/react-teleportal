/**
 * @jest-environment node
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import '@testing-library/jest-dom';
import { Portal, PortalOutlet, PortalProvider } from './portal';

// NOTE: portals aren't *yet* rendered server side due to
// challenges with concurrent mode, but testing to to confirm
// they don't blow up.
test('runs in server environment', () => {
  const App = () => {
    return (
      <PortalProvider>
        <>
          <h1>SSR Test</h1>
          <Portal>
            <div>Portal Child</div>
          </Portal>
          <div data-testid="portal-outlet">
            <PortalOutlet />
          </div>
        </>
      </PortalProvider>
    );
  };
  const html = renderToString(<App />);
  expect(html).toMatchInlineSnapshot(
    `"<h1>SSR Test</h1><div data-testid="portal-outlet"></div>"`
  );
});
