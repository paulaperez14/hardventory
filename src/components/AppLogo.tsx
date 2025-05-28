import type React from 'react';
import { Boxes } from 'lucide-react';

interface AppLogoProps extends React.SVGProps<SVGSVGElement> {
  // You can add custom props if needed
}

export function AppLogo({ className, ...props }: AppLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <Boxes className={cn("h-8 w-8 text-primary", className)} {...props} />
      <span className="text-2xl font-bold text-primary">Hardventory</span>
    </div>
  );
}

// Helper cn function if not globally available or for isolated component
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
