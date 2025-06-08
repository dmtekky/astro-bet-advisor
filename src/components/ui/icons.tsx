import * as React from "react"
import * as Icons from "@radix-ui/react-icons"

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

export const Logo: React.FC<LogoProps> = ({ className = 'h-6 w-6', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
)

export { Icons }
