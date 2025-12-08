"use client";

import { useEffect } from "react";

/**
 * Mobile Menu Script
 * Handles mobile sidebar toggle
 */
export default function MobileMenuScript() {
  useEffect(() => {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const closeBtn = document.getElementById("mobile-menu-close");
    const sidebar = document.getElementById("mobile-sidebar");

    if (!toggleBtn || !sidebar) return;

    const openMenu = () => {
      sidebar.classList.remove("hidden");
    };

    const closeMenu = () => {
      sidebar.classList.add("hidden");
    };

    toggleBtn.addEventListener("click", openMenu);
    if (closeBtn) {
      closeBtn.addEventListener("click", closeMenu);
    }

    // Close on backdrop click
    sidebar.addEventListener("click", (e) => {
      if (e.target === sidebar) {
        closeMenu();
      }
    });

    return () => {
      toggleBtn.removeEventListener("click", openMenu);
      if (closeBtn) {
        closeBtn.removeEventListener("click", closeMenu);
      }
    };
  }, []);

  return null;
}
