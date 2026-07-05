"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { BrandLockup } from "@/components/brand-lockup";

type MobileNavigationProps = {
  email: string;
  organizationName: string;
};

export function MobileNavigation({
  email,
  organizationName,
}: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  function openMenu() {
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    dialogRef.current?.close();
    openButtonRef.current?.focus();
  }

  return (
    <header className="mobile-header">
      <BrandLockup href="/onboarding" />
      <button
        aria-haspopup="dialog"
        className="menu-button"
        onClick={openMenu}
        ref={openButtonRef}
        type="button"
      >
        <span className="muted" aria-hidden="true">
          ☰
        </span>
        <span className="sr-only">Open navigation</span>
      </button>
      <dialog
        aria-label="Primary navigation"
        className="mobile-menu"
        onClose={() => openButtonRef.current?.focus()}
        ref={dialogRef}
      >
        <div className="mobile-menu-header">
          <BrandLockup href="/onboarding" />
          <button
            aria-label="Close navigation"
            className="menu-button"
            onClick={closeMenu}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="tenant-context">
          <span>Active organization</span>
          <strong>{organizationName}</strong>
        </div>
        <nav aria-label="Primary">
          <Link
            className="nav-link nav-link-active"
            href="/onboarding"
          >
            Setup status
          </Link>
        </nav>
        <div className="session-card">
          <span>Signed in as</span>
          <strong>{email}</strong>
          <Link className="button button-secondary" href="/logout">
            Sign out
          </Link>
        </div>
      </dialog>
    </header>
  );
}
