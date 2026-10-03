import Link from "next/link";

const scenes = [
  {
    href: "/sandbox/mission",
    label: "01 · Task",
    title: "What are you after?",
    detail: "Read a fixed brief before choosing anything.",
  },
  {
    href: "/sandbox/pick",
    label: "02 · Pick",
    title: "Which would you pick?",
    detail: "Take a product from a small fictional shelf.",
  },
  {
    href: "/sandbox/reveal",
    label: "03 · Reveal",
    title: "Same product. Different information.",
    detail: "Switch between the product and catalogue views.",
  },
  {
    href: "/sandbox/rescue",
    label: "04 · Rescue",
    title: "One fact. Could it change the shortlist?",
    detail: "Place one supplied fact beside a fixed outcome.",
  },
] as const;

export function SandboxRouteNav() {
  return (
    <section className="sandbox-route-nav" aria-labelledby="sandbox-scenes-heading">
      <div className="preview-section-heading">
        <h2 id="sandbox-scenes-heading">Four small scenes</h2>
        <p>Each route is independent. Nothing carries into the next scene.</p>
      </div>
      <p><Link className="scene-back-link" href="/sandbox/assets">Preview a local image</Link></p>
      <ol className="sandbox-route-list">
        {scenes.map((scene) => (
          <li className="sandbox-route-item" key={scene.href}>
            <Link className="sandbox-route-link" href={scene.href}>
              <span className="sandbox-route-label">{scene.label}</span>
              <span className="sandbox-route-title">{scene.title}</span>
              <span className="sandbox-route-detail">{scene.detail}</span>
              <span className="sandbox-route-arrow" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
