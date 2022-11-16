import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
  useId,
  useLayoutEffect,
  useEffect
} from 'react';

// Merely used to prevent SSR warning
const useIsomorphicLayoutEffect =
  typeof document === 'undefined' ? useEffect : useLayoutEffect;

export interface PortalRegistry {
  readonly add: (id: string, node: React.ReactElement) => void;
  readonly remove: (id: string) => void;
  readonly children: Map<string, React.ReactElement>;
}

const PortalContext = createContext<PortalRegistry | null>(null);

export interface PortalProviderProps {
  readonly children?: React.ReactNode;
}

export const PortalProvider = ({ children }: PortalProviderProps) => {
  const [portalChildren, setPortalChildren] = useState<
    Map<string, React.ReactElement>
  >(new Map());
  const add = useCallback(
    (id: string, element: React.ReactElement) => {
      setPortalChildren((prevChildren) => {
        const nextChildren = new Map(prevChildren);
        nextChildren.set(id, element);
        return nextChildren;
      });
    },
    [setPortalChildren]
  );
  const remove = useCallback(
    (id: string) => {
      setPortalChildren((prevChildren) => {
        const nextChildren = new Map(prevChildren);
        nextChildren.delete(id);
        return nextChildren;
      });
    },
    [setPortalChildren]
  );
  const registry: PortalRegistry = useMemo(
    () => ({
      add,
      remove,
      children: portalChildren
    }),
    [add, remove, portalChildren]
  );
  return (
    <PortalContext.Provider value={registry}>{children}</PortalContext.Provider>
  );
};

const usePortalRegistry = () => {
  const context = useContext(PortalContext);
  if (context === null) {
    throw new Error(
      '`usePortalRegistry` must be used within a `<PortalProvider />`'
    );
  }
  return context;
};

export interface PortalOutletProps {
  readonly children?: (
    children: React.ReactElement[]
  ) => React.ReactNode | undefined;
}

export const PortalOutlet = ({
  children: render = (nodes) => nodes
}: PortalOutletProps) => {
  const registry = usePortalRegistry();
  const children = Array.from(registry.children.entries()).map(([id, node]) =>
    node.key === null ? React.cloneElement(node, { key: id }) : node
  );
  return <>{render(children)}</>;
};

export interface PortalProps {
  readonly children: React.ReactElement;
}

export const Portal = ({ children }: PortalProps) => {
  const id = useId();
  const registry = usePortalRegistry();
  // NOTE: In many scenarios (especially when animating out), you could get away
  // with using `useEffect` rather than `useLayoutEffect` here, but for consistency
  // when it's unmounted as a result of another update (e.g. navigating to another route),
  // it technically needs to be a layout effect to remain in sync.
  useIsomorphicLayoutEffect(() => {
    registry.add(id, children);
  }, [children]);
  useIsomorphicLayoutEffect(() => {
    // NOTE: This cleanup can't occur in the above effect because removing then re-adding on
    // updates has the side effect of changing the order which is undesirable. (We only want
    // to change the order if the portal is unmounted / remounted)
    return () => registry.remove(id);
  }, []);
  return null;
};
