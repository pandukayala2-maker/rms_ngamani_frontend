import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCake,
  HiOutlineBeaker,
  HiOutlineFire,
  HiOutlineRectangleStack,
} from "react-icons/hi2";

// Shared "no photo yet" placeholder icon, picked from the category/item
// name so lists don't show blank boxes before real photos are uploaded.
export function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("breakfast") || n.includes("tiffin")) return HiOutlineSun;
  if (n.includes("dinner")) return HiOutlineMoon;
  if (n.includes("dessert")) return HiOutlineCake;
  if (n.includes("beverage") || n.includes("coffee") || n.includes("tea") || n.includes("juice")) return HiOutlineBeaker;
  if (n.includes("fire") || n.includes("starter") || n.includes("fast") || n.includes("tandoori")) return HiOutlineFire;
  return HiOutlineRectangleStack;
}
