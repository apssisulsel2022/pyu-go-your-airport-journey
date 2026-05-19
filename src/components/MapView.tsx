import { useEffect, useState } from "react";

export function MapView(props: {
  center: [number, number];
  zoom?: number;
  points?: { lat: number; lng: number; label?: string }[];
  route?: [number, number][];
  className?: string;
  showPlane?: boolean;
  planePos?: [number, number];
}) {
  const [mounted, setMounted] = useState(false);
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setMounted(true);
    import("./MapViewClient").then((m) => setComp(() => m.MapViewClient));
  }, []);

  const className = props.className ?? "h-48 w-full";

  if (!mounted || !Comp) {
    return (
      <div className={className + " overflow-hidden rounded-2xl border border-border bg-muted animate-pulse"} />
    );
  }
  return <Comp {...props} />;
}
