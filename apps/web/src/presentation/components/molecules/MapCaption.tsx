import { Card } from '../ui/card';

/** Floating label over the map: what is shown and how many. Shows an ellipsis while the map area is busy. */
export function MapCaption({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="absolute top-3 right-3 left-14 z-[500] flex-row items-baseline gap-2.5 px-3 py-1.5 text-sm shadow-sm sm:right-auto">
      <strong className="first-letter:uppercase">{title}</strong>
      <span className="text-muted-foreground group-aria-busy:after:content-['…']">{detail}</span>
    </Card>
  );
}
