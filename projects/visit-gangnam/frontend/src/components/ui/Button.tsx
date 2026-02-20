import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
  as?: "button" | "a";
  href?: string;
}

export default function Button({
  variant = "primary",
  as = "button",
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-semibold text-sm tracking-wide transition-all duration-300 cursor-pointer";
  const variants = {
    primary: "bg-primary text-white hover:brightness-110 hover:shadow-lg hover:shadow-primary/30",
    outline:
      "border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (as === "a" && href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
