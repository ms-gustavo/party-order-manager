import type { Person } from "../types";

const SIZES = {
  xs: "h-5 w-5 text-[9.5px]",
  sm: "h-[22px] w-[22px] text-[10px]",
  md: "h-7 w-7 text-xs",
};

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

interface AvatarProps {
  person: Person;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function Avatar({ person, size = "md", className = "" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center rounded-full font-bold text-white ${SIZES[size]} ${className}`}
      style={{ backgroundColor: person.color }}
    >
      {initials(person.name)}
    </span>
  );
}
