import { 
  ShoppingCart, Utensils, Home, Zap, Droplet, Car, HeartPulse, 
  Gamepad2, Shirt, Plane, Smartphone, Book, Briefcase, Coins, 
  CreditCard, ShoppingBag, GraduationCap, Dog, Wrench, Bus, 
  Coffee, Dumbbell, Film, Gift, CircleDashed
} from "lucide-react";
import React from "react";

export const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, Utensils, Home, Zap, Droplet, Car, HeartPulse,
  Gamepad2, Shirt, Plane, Smartphone, Book, Briefcase, Coins,
  CreditCard, ShoppingBag, GraduationCap, Dog, Wrench, Bus,
  Coffee, Dumbbell, Film, Gift
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function renderIcon(iconName: string | undefined | null, size = 20) {
  if (!iconName) return <CircleDashed size={size} />;
  
  // Se for um emoji (tamanho 1 ou 2), renderiza como texto
  if (iconName.length <= 2) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{iconName}</span>;
  }

  const IconComponent = ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent size={size} />;
  }

  return <CircleDashed size={size} />;
}

