type LoadingOverlayProps = {
  label?: string;
};

export default function LoadingOverlay({ label = "앱을 불러오는 중..." }: LoadingOverlayProps) {
  return <div className="appBoot">{label}</div>;
}
