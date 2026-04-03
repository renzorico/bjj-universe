import { MouseEvent, PropsWithChildren } from 'react';
import { AppRoute } from '@/app/useAppRoute';

interface AppLinkProps extends PropsWithChildren {
  href: AppRoute;
  className?: string;
  onNavigate: (route: AppRoute) => void;
}

export function AppLink({
  href,
  className,
  children,
  onNavigate,
}: AppLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
