import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const sizeClass = size === "sm" ? "btn--sm" : size === "lg" ? "btn--lg" : "";

  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
