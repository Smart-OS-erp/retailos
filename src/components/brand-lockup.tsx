import Link from "next/link";

type BrandLockupProps = {
  href?: string;
};

export function BrandLockup({ href }: BrandLockupProps) {
  const content = (
    <>
      <span aria-hidden="true" className="brand-mark">
        R
      </span>
      <span>RetailOS</span>
    </>
  );

  return href ? (
    <Link className="brand-lockup" href={href}>
      {content}
    </Link>
  ) : (
    <span className="brand-lockup">{content}</span>
  );
}
