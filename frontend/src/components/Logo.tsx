import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { width: 32, height: 32, text: 'text-sm' },
  md: { width: 40, height: 40, text: 'text-base' },
  lg: { width: 48, height: 48, text: 'text-lg' },
  xl: { width: 64, height: 64, text: 'text-xl' },
};

export function Logo({ size = 'md', showText = false, href, className = '' }: LogoProps) {
  const { width, height, text } = sizeMap[size];
  
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/JUST_Logo.svg"
        alt="JUST Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
      {showText && (
        <span className={`font-semibold ${text} text-gray-800`}>
          JUST Inventory
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
