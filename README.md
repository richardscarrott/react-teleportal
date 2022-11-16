# React Teleportal

Alternative React portal implementation, giving you control over portal rendering.

Primarily written to support uninterrupted exit animations when combined with components such as [`TransitionGroup`](https://reactcommunity.org/react-transition-group/transition-group) and [`AnimationPresence`](https://www.framer.com/docs/animate-presence/).

| Features                    | ReactDOM.createPortal | React Teleportal |
| --------------------------- | --------------------- | ---------------- |
| Custom Rendering            | ❌                    | ✅               |
| Context                     | ✅                    | ✅\*             |
| Server Side Rendering (SSR) | ❌                    | ⚠️\*\*           |
| Multiple Portal Outlets     | ✅                    | ⚠️\*\*\*         |
| React Tree Event Bubbling   | ✅                    | ❌               |

\*Although Portals in React Teleportal don't receive `Context` from the call site, they do receive context from the `PortalOutlet` which means context from root providers will be available.

\*\*Unlike `ReactDOM.createPortal`, React Teleportal doesn't depend on DOM APIs so the intention is to support SSR once a concurrent-safe design has been found.

\*\*\*React Teleportal doesn't currently support multiple portal destinations, but it would be trivial to add. For now it's been omitted because it would effectively become a 'slot' component which, as a pattern, [doesn't play nicely with streaming SSR](https://github.com/cloudflare/react-gateway/issues/49).

## Usage

### Basic

```ts
import { PortalProvider, PortalOutlet, Portal } from 'react-teleportal';

const App = () => {
  return (
    <PortalProvider>
      <div>
        <Portal>I render in the PortalOutlet</Portal>
        <PortalOutlet />
      </div>
    </PortalProvider>
  );
};
```

### Enter / exit animations with [react-transition-group](https://reactcommunity.org/react-transition-group/)

```ts
import { PortalProvider, PortalOutlet, Portal } from 'react-teleportal';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const App = () => {
  return (
    <PortalProvider>
      <div>
        <Portal>
          <CSSTransition classNames="item">
            I render in the PortalOutlet
          </CSSTransition>
        </Portal>
        <PortalOutlet>
          {(children) => <TransitionGroup>{children}</TransitionGroup>}
        </PortalOutlet>
      </div>
    </PortalProvider>
  );
};
```

### Enter / exit animations with [framer-motion](https://www.framer.com/motion/)

```ts
import { PortalProvider, PortalOutlet, Portal } from 'react-teleportal';
import { AnimatePresence, motion } from 'framer-motion';

const App = () => {
  return (
    <PortalProvider>
      <div>
        <Portal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            I render in the PortalOutlet
          </motion.div>
        </Portal>
        <PortalOutlet>
          {(children) => <AnimatePresence>{children}</AnimatePresence>}
        </PortalOutlet>
      </div>
    </PortalProvider>
  );
};
```
