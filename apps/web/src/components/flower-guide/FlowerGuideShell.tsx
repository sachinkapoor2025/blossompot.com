import { FlowerGuideNav } from "./FlowerGuideNav";

export function FlowerGuideShell({
  current,
  children,
}: {
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <FlowerGuideNav current={current} />
      {children}
    </div>
  );
}
