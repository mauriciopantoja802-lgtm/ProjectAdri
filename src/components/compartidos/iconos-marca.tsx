import type { SVGProps } from "react";

/**
 * Íconos de redes sociales. lucide-react 1.x retiró los íconos de marcas,
 * así que los dibujamos con el mismo estilo de línea (stroke 2, 24×24).
 */
export function IconoInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}
