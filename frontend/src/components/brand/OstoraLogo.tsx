import Link from "next/link";

type OstoraLogoProps = {
  href?: string;
  showText?: boolean;
  textClassName?: string;
  containerClassName?: string;
  iconWrapperClassName?: string;
  imageClassName?: string;
};

export default function OstoraLogo({
  href,
  showText = true,
  textClassName = "text-xl font-extrabold tracking-tight",
  containerClassName = "flex items-center gap-3",
  iconWrapperClassName = "grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/5",
  imageClassName = "h-6 w-6 object-contain",
}: OstoraLogoProps) {
  const content = (
    <div className={containerClassName}>
      <div className={iconWrapperClassName}>
        <img src="/ostora_logo.png" alt="Ostora" className={imageClassName} />
      </div>
      {showText ? <span className={textClassName}>Ostora</span> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
