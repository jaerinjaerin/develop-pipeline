interface SectionHeaderProps {
  label: string;
  title: string;
  highlight?: string;
  description?: string;
  dark?: boolean;
  align?: "left" | "center";
}

export default function SectionHeader({
  label,
  title,
  highlight,
  description,
  dark = false,
  align = "center",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  const titleColor = dark ? "text-white" : "text-text-main";
  const descColor = dark ? "text-gray-400" : "text-text-sub";
  const labelColor = dark ? "text-secondary" : "text-primary";

  const renderTitle = () => {
    if (!highlight) return title;
    const parts = title.split(highlight);
    return (
      <>
        {parts[0]}
        <span className="text-gradient-primary">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={`mb-12 ${alignClass}`}>
      <span
        className={`mb-3 inline-block font-display text-sm font-semibold tracking-[0.2em] uppercase ${labelColor}`}
      >
        {label}
      </span>
      <h2
        className={`text-3xl font-bold md:text-4xl lg:text-[42px] ${titleColor} leading-tight`}
      >
        {renderTitle()}
      </h2>
      {description && (
        <p className={`mx-auto mt-4 max-w-xl text-base ${descColor}`}>
          {description}
        </p>
      )}
    </div>
  );
}
