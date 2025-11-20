import {
  Plane,
  Globe,
  Map,
  Compass,
  Luggage,
  Camera,
  Mountain,
  Palmtree,
  Ship,
  Train,
} from "lucide-react";

const ICON_MAP = {
  plane: Plane,
  globe: Globe,
  map: Map,
  compass: Compass,
  luggage: Luggage,
  camera: Camera,
  mountain: Mountain,
  palmtree: Palmtree,
  ship: Ship,
  train: Train,
};

interface UserIconProps {
  iconName?: string | null;
  className?: string;
  color?: string;
}

export function UserIcon({ iconName, className = "w-6 h-6", color }: UserIconProps) {
  const IconComponent = iconName && ICON_MAP[iconName as keyof typeof ICON_MAP] 
    ? ICON_MAP[iconName as keyof typeof ICON_MAP] 
    : Plane;

  return <IconComponent className={className} style={color ? { stroke: color } : undefined} />;
}
