/**
 * FAQ — every question and answer is rendered in the static HTML, always
 * visible. No accordion: the answers are sales content and shouldn't require
 * a click. The matching FAQPage JSON-LD lives on the assessment page.
 */
export default function Faq({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  return (
    <div className="divide-y divide-tan border-y border-tan">
      {items.map((item, i) => (
        <div key={i} className="py-6">
          <h3 className="font-serif text-lg text-forest">{item.q}</h3>
          <p className="mt-3 leading-relaxed text-charcoal">{item.a}</p>
        </div>
      ))}
    </div>
  );
}
