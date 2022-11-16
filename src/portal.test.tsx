/**
 * @jest-environment jsdom
 */

import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Portal, PortalOutlet, PortalProvider } from './portal';

test('renders the portal child element in the portal outlet', async () => {
  const App = () => {
    const [visible, setVisible] = useState(true);
    return (
      <PortalProvider>
        <>
          <button
            data-testid="portal-visibility-toggle"
            onClick={() => setVisible((prev) => !prev)}
          >
            Toggle
          </button>
          {visible ? (
            <Portal>
              <div data-testid="portal-child">Child</div>
            </Portal>
          ) : null}
          <div data-testid="portal-outlet">
            <PortalOutlet />
          </div>
        </>
      </PortalProvider>
    );
  };
  render(<App />);

  expect(screen.getByTestId('portal-outlet')).toContainElement(
    screen.getByTestId('portal-child')
  );

  fireEvent.click(screen.getByTestId('portal-visibility-toggle'));

  expect(screen.getByTestId('portal-outlet')).toBeEmptyDOMElement();
  expect(screen.queryByTestId('portal-child')).toBeNull();

  fireEvent.click(screen.getByTestId('portal-visibility-toggle'));

  expect(screen.getByTestId('portal-outlet')).toContainElement(
    screen.getByTestId('portal-child')
  );
});

test('renders multiple portal child elements in the portal outlet, ordered by first-mounted', async () => {
  const App = () => {
    const [portal1Visible, setPortal1Visible] = useState(true);
    const [portal2Visible, setPortal2Visible] = useState(true);
    const forceRender = useState({})[1].bind(undefined, {});
    return (
      <PortalProvider>
        <>
          <button
            data-testid="portal1-visibility-toggle"
            onClick={() => setPortal1Visible((prev) => !prev)}
          >
            Toggle Portal 1
          </button>
          <button
            data-testid="portal2-visibility-toggle"
            onClick={() => setPortal2Visible((prev) => !prev)}
          >
            Toggle Portal 2
          </button>
          <button
            data-testid="force-render-button"
            onClick={() => forceRender()}
          >
            Force Render
          </button>
          {portal1Visible ? (
            <Portal>
              <div data-testid="portal1-child">Portal 1 Child</div>
            </Portal>
          ) : null}
          {portal2Visible ? (
            <Portal>
              <div data-testid="portal2-child">Portal 2 Child</div>
            </Portal>
          ) : null}
          <div data-testid="portal-outlet">
            <PortalOutlet />
          </div>
        </>
      </PortalProvider>
    );
  };

  const assert = (portals: ('portal1' | 'portal2')[]) => {
    const children = screen.getByTestId('portal-outlet').children;
    expect(children).toHaveLength(portals.length);
    portals.forEach((portal, i) => {
      expect(children[i]).toBe(screen.getByTestId(`${portal}-child`));
    });
  };

  // NOTE: We force render after each state change to ensure the order
  // remains stable; (The initial impl. presented a bug in this case)

  render(<App />);
  assert(['portal1', 'portal2']);
  fireEvent.click(screen.getByTestId('force-render-button'));
  assert(['portal1', 'portal2']);

  fireEvent.click(screen.getByTestId('portal1-visibility-toggle'));
  assert(['portal2']);
  fireEvent.click(screen.getByTestId('force-render-button'));
  assert(['portal2']);

  fireEvent.click(screen.getByTestId('portal2-visibility-toggle'));
  assert([]);
  fireEvent.click(screen.getByTestId('force-render-button'));
  assert([]);

  fireEvent.click(screen.getByTestId('portal2-visibility-toggle'));
  assert(['portal2']);
  fireEvent.click(screen.getByTestId('force-render-button'));
  assert(['portal2']);

  fireEvent.click(screen.getByTestId('portal1-visibility-toggle'));
  assert(['portal2', 'portal1']);
  fireEvent.click(screen.getByTestId('force-render-button'));
  assert(['portal2', 'portal1']);
});

test("rerenders when a portal's child element updates & additionally ensures stable identity", () => {
  // NOTE: Even if keys are omitted, React will not warn about the lack of key's here because the
  // owner of the element (`App`), doesn't render an array; it's the `PortalOutlet` that ends up
  // rendering an array and React doesn't appear to be able to figure this out or perhaps chooses
  // to suppress this as it can't assign blame.
  const App = () => {
    const [portal1Visible, setPortal1Visible] = useState(false);
    const [portal2Visible, setPortal2Visible] = useState(false);
    return (
      <PortalProvider>
        <>
          <button
            data-testid="portal1-visibility-toggle"
            onClick={() => setPortal1Visible((prev) => !prev)}
          >
            Toggle Portal 1
          </button>
          <button
            data-testid="portal2-visibility-toggle"
            onClick={() => setPortal2Visible((prev) => !prev)}
          >
            Toggle Portal 2
          </button>
          {portal1Visible ? (
            <Portal>
              <Counter prefix="portal1" />
            </Portal>
          ) : null}
          {portal2Visible ? (
            <Portal>
              <Counter prefix="portal2" />
            </Portal>
          ) : null}
          <div data-testid="portal-outlet">
            <PortalOutlet />
          </div>
        </>
      </PortalProvider>
    );
  };

  interface CounterAssertion {
    readonly name: 'portal1' | 'portal2';
    readonly count: number;
  }

  const assert = (counters: CounterAssertion[]) => {
    const children = screen.getByTestId('portal-outlet').children;
    expect(children).toHaveLength(counters.length);
    counters.forEach(({ name, count }, i) => {
      expect(children[i]).toBe(screen.getByTestId(`${name}-counter`));
      expect(screen.getByTestId(`${name}-counter-count`)).toHaveTextContent(
        count.toString()
      );
    });
  };

  render(<App />);
  assert([]);

  fireEvent.click(screen.getByTestId('portal2-visibility-toggle'));
  assert([{ name: 'portal2', count: 0 }]);

  fireEvent.click(screen.getByTestId('portal1-visibility-toggle'));
  assert([
    { name: 'portal2', count: 0 },
    { name: 'portal1', count: 0 }
  ]);

  fireEvent.click(screen.getByTestId('portal1-counter-button'));
  assert([
    { name: 'portal2', count: 0 },
    { name: 'portal1', count: 1 }
  ]);

  fireEvent.click(screen.getByTestId('portal2-counter-button'));
  assert([
    { name: 'portal2', count: 1 },
    { name: 'portal1', count: 1 }
  ]);

  fireEvent.click(screen.getByTestId('portal2-counter-button'));
  assert([
    { name: 'portal2', count: 2 },
    { name: 'portal1', count: 1 }
  ]);

  fireEvent.click(screen.getByTestId('portal2-counter-button'));
  assert([
    { name: 'portal2', count: 3 },
    { name: 'portal1', count: 1 }
  ]);

  fireEvent.click(screen.getByTestId('portal2-visibility-toggle'));
  assert([{ name: 'portal1', count: 1 }]);
});

test('allows the portal outlet to customize how portal children are rendered', async () => {
  const App = () => {
    return (
      <PortalProvider>
        <div data-testid="root">
          App
          <Portal>
            <span data-testid="portal1-child">Portal Child 1</span>
          </Portal>
          <Portal>
            <span data-testid="portal2-child">Portal Child 2</span>
          </Portal>
          <div data-testid="portal-outlet">
            <PortalOutlet>
              {(children) => {
                return (
                  <div data-testid="portal-outlet-inner">
                    {React.Children.map(children, (child) => (
                      <div data-testid="portal-outlet-child" key={child.key}>
                        {child}
                      </div>
                    ))}
                  </div>
                );
              }}
            </PortalOutlet>
          </div>
        </div>
      </PortalProvider>
    );
  };

  render(<App />);

  expect(screen.getByTestId('root')).toMatchInlineSnapshot(`
    <div
      data-testid="root"
    >
      App
      <div
        data-testid="portal-outlet"
      >
        <div
          data-testid="portal-outlet-inner"
        >
          <div
            data-testid="portal-outlet-child"
          >
            <span
              data-testid="portal1-child"
            >
              Portal Child 1
            </span>
          </div>
          <div
            data-testid="portal-outlet-child"
          >
            <span
              data-testid="portal2-child"
            >
              Portal Child 2
            </span>
          </div>
        </div>
      </div>
    </div>
  `);
});

// Utils

interface CounterProps {
  readonly prefix: string;
}

const Counter = ({ prefix }: CounterProps) => {
  const [count, setCount] = useState(0);
  return (
    <div data-testid={`${prefix}-counter`}>
      <span data-testid={`${prefix}-counter-count`}>{count}</span>
      <button
        data-testid={`${prefix}-counter-button`}
        onClick={() => setCount((prev) => ++prev)}
      >
        Increment
      </button>
    </div>
  );
};
