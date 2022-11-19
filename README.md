# React Teleportal

[![GitHub package.json version](https://img.shields.io/github/package-json/v/richardscarrott/react-teleportal.svg)](https://www.npmjs.com/package/react-teleportal)
[![CI](https://github.com/richardscarrott/react-teleportal/actions/workflows/node.js.yml/badge.svg)](https://github.com/richardscarrott/react-teleportal/actions/workflows/node.js.yml)
[![GitHub license](https://img.shields.io/github/license/richardscarrott/react-teleportal.svg)](https://github.com/richardscarrott/react-teleportal/blob/main/LICENSE)

Alternative [React Portal](https://reactjs.org/docs/portals.html) implementation, giving you control over portal rendering.

Primarily written to support uninterrupted exit animations when combined with components such as [`TransitionGroup`](https://reactcommunity.org/react-transition-group/transition-group) and [`AnimatePresence`](https://www.framer.com/docs/animate-presence/).

## Install

```
npm install react-teleportal
```

## Examples

### React Teleportal x React Transition Group

https://codesandbox.io/s/react-teleportal-x-react-transition-group-k31d8p

### React Teleportal x Framer Motion

https://codesandbox.io/s/react-teleportal-x-framer-motion-766nu7

## Features

| Features                    | React Teleportal | ReactDOM.createPortal |
| --------------------------- | ---------------- | --------------------- |
| Custom Rendering            | ✅               | ❌                    |
| Context                     | ✅\*             | ✅                    |
| Server Side Rendering (SSR) | ⚠️†              | ❌                    |
| Multiple Portal Outlets     | ❌‡              | ✅                    |
| React Tree Event Bubbling   | ❌               | ✅                    |

\* Although `<Portal />`s in React Teleportal don't receive context from their own call site, they do receive context from the `<PortalOutlet />` call site which means context from root providers will be available.

† Unlike `ReactDOM.createPortal`, React Teleportal doesn't depend on DOM APIs so the intention is to support SSR once a concurrent-safe solution has been found.

‡ React Teleportal doesn't currently support multiple portal outlets, but it would be trivial to add. For now it's been omitted because it would effectively become a "slot" library which, as a pattern, [doesn't play nicely with streaming SSR](https://github.com/cloudflare/react-gateway/issues/49).

## API

### Basic

```tsx
import React, { useState } from 'react';
import { PortalProvider, PortalOutlet, Portal } from 'react-teleportal';

const App = () => {
  const [show, setShow] = useState(true);
  return (
    <PortalProvider>
      <button onClick={() => setShow(!show)}>Toggle</button>
      {show ? (
        <Portal>
          <>I render in the PortalOutlet</>
        </Portal>
      ) : null}
      <PortalOutlet />
    </PortalProvider>
  );
};
```

### Animations with [react-transition-group](https://codesandbox.io/s/react-teleportal-x-react-transition-group-k31d8p)

```tsx
import React, { useState, useRef } from 'react';
import { PortalProvider, PortalOutlet, Portal } from 'react-teleportal';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const App = () => {
  const [show, setShow] = useState(true);
  const nodeRef = useRef(null);
  return (
    <PortalProvider>
      <button onClick={() => setShow(!show)}>Toggle</button>
      {show ? (
        <Portal>
          <CSSTransition
            // `key` ensures showing / hiding the portal will reverse an in-flight animation rather than create a new instance.
            key="5f337061-5476-40a0-898e-e9f9827043b1"
            nodeRef={nodeRef}
            timeout={200}
            classNames="my-node"
          >
            <div ref={nodeRef}>I render in the PortalOutlet</div>
          </CSSTransition>
        </Portal>
      ) : null}
      <PortalOutlet>
        {(children) => <TransitionGroup>{children}</TransitionGroup>}
      </PortalOutlet>
    </PortalProvider>
  );
};
```

### Animations with [framer-motion](https://codesandbox.io/s/react-teleportal-x-framer-motion-766nu7)

```tsx
import React, { useState } from 'react';
import { PortalProvider, PortalOutlet, Portal } from 'react-teleportal';
import { AnimatePresence, motion } from 'framer-motion';

const App = () => {
  const [show, setShow] = useState(true);
  return (
    <PortalProvider>
      <button onClick={() => setShow(!show)}>Toggle</button>
      {show ? (
        <Portal>
          <motion.div
            // `key` ensures showing / hiding the portal will reverse an in-flight animation rather than create a new instance.
            key="02fe2dd1-e9d8-46e4-898b-4c1966c9a68b"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            I render in the PortalOutlet
          </motion.div>
        </Portal>
      ) : null}
      <PortalOutlet>
        {(children) => <AnimatePresence>{children}</AnimatePresence>}
      </PortalOutlet>
    </PortalProvider>
  );
};
```

## FAQ

### Does React Teleportal support SSR?

React Teleportal won't blow up on the server, but `<Portal />`s won't be rendered to HTML server side and instead will be rendered once on the client.

The intention is to eventually find a concurrent-safe SSR solution.

### Can I have multiple _named_ `<PortalOutlet />`s?

No not currently. React Teleportal intends to eventually support SSR & treating this as a "slot" library makes SSR less viable.

React Gateway is a good example of the "slot" pattern and [how it can easily fail if misused](https://github.com/cloudflare/react-gateway/issues/49).

```tsx
import { GatewayProvider, GatewayDest, Gateway } from 'react-gateway';

const App = () => {
  return (
    <GatewayProvider>
      <header>
        <GatewayDest name="header-slot" />
      </header>
      <section>
        <Gateway into="header-slot">
          SSR will fail to render this as the "header-slot" has already rendered
          (and if streaming, the html has potentially already been flushed to
          the client).
        </Gateway>
      </section>
    </GatewayProvider>
  );
};
```

React Teleportal is therefore stricter and only allows a single `<GatewayDest />` (or `<PortalOutlet />` in React Teleportal terminology) which should be rendered at the _bottom_ of the root component.

### How do I manage stacking order?

It's recommended to avoid z-index and treat your `<PortalOutlet />` similar to the DOM's [Top Layer](https://developer.chrome.com/blog/what-is-the-top-layer/) whereby the most recently ~~opened~~ mounted `<Portal />` is rendered last and therefore naturally stacked on top.

### Why do I need to add a `key` to the `<Portal />` child when animating?

The collective `<Portal />` children are ultimately rendered as `children` of the `<PortalOutlet />` which means React is rendering a variable length array of elements which [requires a `key`](https://beta.reactjs.org/learn/rendering-lists).

It's recommended to just statically include a `uuid` or similar at the call site of each distinct `<Portal />` child to ensure it remains unique as your app grows.

```tsx
<Portal>
  <div key="6db2c89c-dbb4-4c9e-96fa-8ad1d3dec463">Hello World</div>
</Portal>
```

> NOTE: If you're not animating (i.e. if the `<PortalOutlet />` unmounts the child immediately), then you can omit the key as React Teleportal is able to assign a key on your behalf.

## License

[MIT](LICENSE)
