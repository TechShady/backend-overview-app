import React from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components-preview/layouts";

const AppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="22" height="22" style={{ marginRight: 6, verticalAlign: "middle", flexShrink: 0 }}>
    <circle cx="32" cy="32" r="26" fill="none" stroke="#7c4dff" strokeWidth="1.8" opacity="0.35"/>
    <circle cx="32" cy="32" r="18" fill="none" stroke="#00bfa5" strokeWidth="2" opacity="0.55"/>
    <circle cx="32" cy="32" r="10" fill="none" stroke="#40c4ff" strokeWidth="2.2" opacity="0.85"/>
    <circle cx="32" cy="32" r="3.5" fill="#40c4ff"/>
    <circle cx="32" cy="6" r="3.5" fill="#7c4dff"/>
    <circle cx="52" cy="20" r="3" fill="#7c4dff" opacity="0.75"/>
    <circle cx="12" cy="44" r="3" fill="#7c4dff" opacity="0.75"/>
    <circle cx="18" cy="20" r="3" fill="#00bfa5"/>
    <circle cx="46" cy="42" r="3" fill="#00bfa5"/>
    <circle cx="20" cy="46" r="2.5" fill="#00bfa5" opacity="0.7"/>
    <circle cx="26" cy="24" r="2.5" fill="#40c4ff"/>
    <circle cx="40" cy="28" r="2.5" fill="#40c4ff" opacity="0.8"/>
  </svg>
);

export const Header = () => {
  return (
    <AppHeader>
      <AppHeader.NavItems>
        <AppHeader.AppNavLink as={Link} to="/" />
        <AppHeader.NavItem as={Link} to="/">
          <AppIcon />
          Backend Overview
        </AppHeader.NavItem>
      </AppHeader.NavItems>
    </AppHeader>
  );
};
