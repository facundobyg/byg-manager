"use client";

import { useState } from "react";
import { User } from "lucide-react";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

export function UserAvatar({
  image,
  name,
  iconSize = 18,
}: {
  image?: string | null;
  name?: string | null;
  iconSize?: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name ?? "Avatar"}
        onError={() => setImgError(true)}
        className="h-full w-full rounded-full object-cover"
      />
    );
  }

  if (name) {
    return (
      <span className="text-xs font-black text-byg-accent select-none">
        {getInitials(name)}
      </span>
    );
  }

  return <User size={iconSize} />;
}
