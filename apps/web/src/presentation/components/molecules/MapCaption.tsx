export function MapCaption({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="map-caption">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
