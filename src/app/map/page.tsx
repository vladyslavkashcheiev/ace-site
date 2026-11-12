import MapView from "./MapView";

export const metadata = { title: "Карта Fort Zancudo — ACE" };

export default function MapPage() {
  return (
    <main className="container section" style={{ maxWidth: 1320 }}>
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">// Блэйн Каунти</span>
        <h1 style={{ fontSize: 44 }}>Карта Fort Zancudo</h1>
      </div>
      <MapView />
    </main>
  );
}
