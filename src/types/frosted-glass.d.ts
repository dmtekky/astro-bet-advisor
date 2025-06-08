// TypeScript declaration for frosted-glass custom elements
// Allows JSX to accept <frosted-glass-container> and <frosted-glass>
declare namespace JSX {
  interface IntrinsicElements {
    'frosted-glass-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'frosted-glass': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
