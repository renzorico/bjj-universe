import { useEffect, useState } from 'react';

export type AppRoute = '/' | '/universe';

const supportedRoutes = new Set<AppRoute>(['/', '/universe']);

export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() =>
    normalizeRoute(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      setRoute(normalizeRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    if (nextRoute === route) {
      return;
    }

    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
  };

  return {
    route,
    navigate,
  };
}

function normalizeRoute(pathname: string): AppRoute {
  return supportedRoutes.has(pathname as AppRoute)
    ? (pathname as AppRoute)
    : '/';
}
