import { useEffect, useState } from 'react';

export type AppRoute = '/' | '/universe';

const supportedRoutes = new Set<AppRoute>(['/', '/universe']);
const basePath = normalizeBasePath(import.meta.env.BASE_URL);

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

    window.history.pushState({}, '', withBasePath(nextRoute));
    setRoute(nextRoute);
  };

  return {
    route,
    navigate,
  };
}

function normalizeRoute(pathname: string): AppRoute {
  const pathWithoutBase = stripBasePath(pathname);

  return supportedRoutes.has(pathWithoutBase as AppRoute)
    ? (pathWithoutBase as AppRoute)
    : '/';
}

function normalizeBasePath(rawBasePath: string): string {
  if (!rawBasePath || rawBasePath === '/') {
    return '';
  }

  const withLeadingSlash = rawBasePath.startsWith('/')
    ? rawBasePath
    : `/${rawBasePath}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function stripBasePath(pathname: string): string {
  if (!basePath) {
    return pathname;
  }

  if (pathname === basePath) {
    return '/';
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length);
  }

  return pathname;
}

function withBasePath(route: AppRoute): string {
  return basePath ? `${basePath}${route}` : route;
}
