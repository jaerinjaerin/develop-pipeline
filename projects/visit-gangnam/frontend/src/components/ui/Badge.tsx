interface BadgeProps {
  type: "live" | "soon";
  children: React.ReactNode;
}

export default function Badge({ type, children }: BadgeProps) {
  const colors = {
    live: "bg-primary",
    soon: "bg-secondary",
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${colors[type]}`}
    >
      {children}
    </span>
  );
}
