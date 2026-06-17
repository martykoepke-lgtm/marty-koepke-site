import { redirect } from "next/navigation";

/**
 * Legacy /ai-visibility/order route — replaced by /scan per D006.
 *
 * The 8-field v1.0 order form was retired when the free Readiness Check
 * was rebuilt as a URL-only flow. Any traffic still hitting this URL
 * (old links, indexed pages, Google cache) is permanently redirected
 * to /scan so we don't break those entry points.
 */

export default function OrderPage() {
  redirect("/scan");
}
