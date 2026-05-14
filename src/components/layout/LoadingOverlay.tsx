type LoadingOverlayProps = {
  label?: string;
};

export default function LoadingOverlay({ label = "앱을 불러오는 중..." }: LoadingOverlayProps) {
  return (
    <div className="appBoot" role="status" aria-live="polite">
      <span className="appBoot__mark" aria-hidden="true">♡</span>
      <span className="appBoot__label">{label}</span>
    </div>
  );
}
