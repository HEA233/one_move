import Link from "next/link";

export function HomePreview() {
  return (
    <section className="home-preview" aria-labelledby="home-preview-title">
      <div className="home-preview-copy">
        <h1 id="home-preview-title">A place on the shelf. Or a ghost.</h1>
        <p>Open the independent component previews for GHOSTED.</p>
        <Link className="preview-button preview-button--primary home-preview-link" href="/sandbox">
          Open the component preview
        </Link>
      </div>
    </section>
  );
}
