type MemoCardProps = {
  id: string;
  title: string;
  body: string;
  date: string;
  onDelete?: (id: string) => void;
};

export default function MemoCard({ id, title, body, date, onDelete }: MemoCardProps) {
  return (
    <div className="memo" data-id={id}>
      <div className="memo__top">
        <div className="memo__title">{title}</div>
        <div className="memo__date">{date}</div>
      </div>
      <div className="memo__body">{body}</div>
      <div className="memo__actions">
        <button className="btn btn--ghost" type="button" data-del={id} onClick={() => onDelete?.(id)}>삭제</button>
      </div>
    </div>
  );
}
