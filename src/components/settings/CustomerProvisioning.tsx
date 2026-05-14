import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRoom } from "../../contexts/RoomContext";
import { downloadJson, exportRoomBackup } from "../../services/backupService";
import {
  getRoomManagementSnapshot,
  provisionCustomerRoom,
  updateRoomManagement,
  type ProvisionedCustomerRoom,
  type RoomManagementSnapshot,
} from "../../services/roomService";
import { useConfirm } from "../layout/ModalProvider";

function toISODateInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromISODateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0).getTime();
}

function credentialText(result: ProvisionedCustomerRoom) {
  const appUrl = window.location.origin + window.location.pathname;
  return [
    "두 사람만의 공간이 준비되었어요",
    `앱 주소: ${appUrl}`,
    `커플 코드: ${result.coupleCode}`,
    `관리자 비밀번호: ${result.adminPassword}`,
    `보기 비밀번호: ${result.viewerPassword}`,
  ].join("\n");
}

function memberSummary(snapshot: RoomManagementSnapshot | null) {
  if (!snapshot) return { admins: 0, viewers: 0 };
  return Object.values(snapshot.members).reduce((acc, member) => {
    if (member?.role === "admin") acc.admins += 1;
    if (member?.role === "viewer") acc.viewers += 1;
    return acc;
  }, { admins: 0, viewers: 0 });
}

export default function CustomerProvisioning() {
  const { couple, refreshRoom, roomId, systemAdmin } = useRoom();
  const requestConfirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<RoomManagementSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [nameA, setNameA] = useState(couple.nameA);
  const [nameB, setNameB] = useState(couple.nameB);
  const [startDate, setStartDate] = useState(toISODateInputValue(couple.startDate));
  const [adminPassword, setAdminPassword] = useState("");
  const [viewerPassword, setViewerPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ProvisionedCustomerRoom | null>(null);
  const [hint, setHint] = useState("고객의 커플룸을 따뜻하게 준비하고 안전하게 관리할 수 있어요.");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const deliveryText = useMemo(() => result ? credentialText(result) : "", [result]);
  const summary = useMemo(() => memberSummary(snapshot), [snapshot]);
  const busy = loadingSnapshot || saving || exporting || creating;

  useEffect(() => {
    setNameA(couple.nameA);
    setNameB(couple.nameB);
    setStartDate(toISODateInputValue(couple.startDate));
  }, [couple.nameA, couple.nameB, couple.startDate]);

  const loadSnapshot = useCallback(async () => {
    if (!systemAdmin || !roomId) return;
    setLoadingSnapshot(true);
    setStatus("idle");
    try {
      const nextSnapshot = await getRoomManagementSnapshot(roomId);
      setSnapshot(nextSnapshot);
      if (nextSnapshot) {
        setNameA(nextSnapshot.nameA);
        setNameB(nextSnapshot.nameB);
        setStartDate(toISODateInputValue(nextSnapshot.startDate));
      }
    } catch (caught) {
      console.error("Customer dashboard load failed", caught);
      setStatus("error");
      setHint("고객 정보를 불러오지 못했어요. 시스템 관리자 권한을 확인해주세요.");
    } finally {
      setLoadingSnapshot(false);
    }
  }, [roomId, systemAdmin]);

  useEffect(() => {
    if (!open) return;
    void loadSnapshot();
  }, [loadSnapshot, open]);

  if (!systemAdmin) return null;

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId || busy) return;
    const changesPassword = Boolean(adminPassword.trim() || viewerPassword.trim());
    const ok = await requestConfirm({
      title: changesPassword ? "초대 정보 변경" : "커플룸 정보 저장",
      message: changesPassword
        ? "비밀번호를 바꾸면 고객에게 전달한 기존 안내가 달라져요. 저장할까요?"
        : "고객의 커플룸 정보를 이 내용으로 저장할까요?",
      confirmLabel: "저장",
    });
    if (!ok) {
      setHint("변경을 취소했어요.");
      setStatus("idle");
      return;
    }

    setSaving(true);
    setStatus("idle");
    setHint("커플룸 정보를 정돈하는 중이에요...");
    try {
      await updateRoomManagement(roomId, {
        nameA: nameA.trim() || couple.nameA,
        nameB: nameB.trim() || couple.nameB,
        startDate: fromISODateInputValue(startDate),
        adminPassword,
        viewerPassword,
      });
      setAdminPassword("");
      setViewerPassword("");
      await loadSnapshot();
      await refreshRoom();
      setStatus("success");
      setHint("커플룸 정보가 예쁘게 저장됐어요.");
    } catch (caught) {
      console.error("Customer dashboard save failed", caught);
      setStatus("error");
      setHint("저장하지 못했어요. 시스템 관리자 권한을 확인해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!roomId || busy) return;
    setExporting(true);
    setStatus("idle");
    setHint("고객의 기록을 조심스럽게 모으는 중이에요...");
    try {
      const backup = await exportRoomBackup(roomId);
      downloadJson(`couple-room-${roomId}-backup.json`, backup);
      setStatus("success");
      setHint("고객의 기록 파일을 준비했어요.");
    } catch (caught) {
      console.error("Customer dashboard export failed", caught);
      setStatus("error");
      setHint("기록을 내보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = async () => {
    if (busy) return;
    const ok = await requestConfirm({
      title: "새 커플룸 준비",
      message: "새 고객에게 전달할 커플룸과 초대 비밀번호를 만들까요?",
      confirmLabel: "준비하기",
    });
    if (!ok) {
      setHint("새 커플룸 준비를 취소했어요.");
      setStatus("idle");
      return;
    }

    setCreating(true);
    setStatus("idle");
    setHint("새 고객을 위한 커플룸을 준비하는 중이에요...");
    try {
      const created = await provisionCustomerRoom();
      setResult(created);
      setStatus("success");
      setHint("새 커플룸이 준비됐어요. 아래 안내를 복사해 고객에게 전달해주세요.");
    } catch (caught) {
      console.error("Customer provisioning failed", caught);
      setStatus("error");
      setHint("새 커플룸을 만들지 못했어요. 권한과 중복 코드를 확인해주세요.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!deliveryText) return;
    try {
      await navigator.clipboard.writeText(deliveryText);
      setStatus("success");
      setHint("고객에게 전달할 안내를 복사했어요.");
    } catch (caught) {
      console.error("Customer delivery copy failed", caught);
      setStatus("error");
      setHint("전달 정보를 복사하지 못했어요. 다시 시도해주세요.");
    }
  };

  const handleShare = async () => {
    if (!result || !deliveryText) return;
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: "두 사람만의 공간이 준비되었어요",
        text: deliveryText,
        url: window.location.origin + window.location.pathname,
      });
      setStatus("success");
      setHint("고객에게 전달할 안내를 열었어요.");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      console.error("Customer delivery share failed", caught);
      setStatus("error");
      setHint("공유를 열지 못했어요. 복사하기를 사용해주세요.");
    }
  };

  return (
    <article className="card customerDashboard">
      <div className="customerDashboard__entry">
        <div>
          <div className="card__title">고객 커플룸</div>
          <p className="hint">고객에게 전달되는 사랑의 공간을 차분하게 준비해요.</p>
        </div>
        <button className="btn btn--primary" type="button" onClick={() => setOpen((value) => !value)} disabled={busy}>
          {open ? "접기" : "커플룸 관리"}
        </button>
      </div>

      {open ? (
        <div className="customerDashboard__body" aria-busy={busy ? "true" : "false"}>
          {loadingSnapshot ? <p className="hint loadingHint">커플룸 정보를 불러오는 중...</p> : null}

          <section className="customerDashboard__section customerDashboard__section--featured">
            <div className="customerDashboard__sectionHead">
              <span className="customerDashboard__icon" aria-hidden="true">♡</span>
              <div>
                <h3>현재 커플룸</h3>
                <p>{nameA}와 {nameB}의 이야기가 담길 공간이에요.</p>
              </div>
            </div>

            <div className="customerDashboard__stats">
              <div><span>커플</span><strong>{nameA} · {nameB}</strong></div>
              <div><span>초대 코드</span><strong>{roomId || "-"}</strong></div>
              <div><span>처음 만난 날</span><strong>{startDate}</strong></div>
              <div><span>함께 들어온 사람</span><strong>관리 {summary.admins}명 · 보기 {summary.viewers}명</strong></div>
            </div>

            <form className="form customerDashboard__form" onSubmit={handleSave}>
              <label className="label">첫 번째 이름<input className="input" type="text" maxLength={8} value={nameA} onChange={(event) => setNameA(event.target.value)} disabled={busy} /></label>
              <label className="label">두 번째 이름<input className="input" type="text" maxLength={8} value={nameB} onChange={(event) => setNameB(event.target.value)} disabled={busy} /></label>
              <label className="label">우리 시작일<input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={busy} /></label>
              <label className="label">관리자 초대 비밀번호<input className="input" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={snapshot?.hasAdminPassword ? "바꿀 때만 입력" : "새 비밀번호"} disabled={busy} /></label>
              <label className="label">보기 전용 비밀번호<input className="input" type="password" value={viewerPassword} onChange={(event) => setViewerPassword(event.target.value)} placeholder={snapshot?.hasViewerPassword ? "바꿀 때만 입력" : "새 비밀번호"} disabled={busy} /></label>
              <div className="row">
                <button className="btn btn--primary" type="submit" disabled={busy}>{saving ? "저장 중..." : "커플룸 저장"}</button>
                <button className="btn btn--soft" type="button" onClick={handleExport} disabled={busy}>{exporting ? "내보내는 중..." : "기록 내보내기"}</button>
              </div>
            </form>
          </section>

          <section className="customerDashboard__section">
            <div className="customerDashboard__sectionHead">
              <span className="customerDashboard__icon customerDashboard__icon--soft" aria-hidden="true">＋</span>
              <div>
                <h3>고객 목록</h3>
                <p>앞으로 여러 커플룸을 한눈에 살펴볼 수 있도록 준비해두었어요.</p>
              </div>
            </div>
            <div className="customerDashboard__list">
              <div className="customerCard">
                <span className="customerCard__label">운영 중인 커플룸</span>
                <strong>{nameA} · {nameB}</strong>
                <small>{roomId}</small>
              </div>
            </div>
          </section>

          <section className="customerDashboard__section customerDashboard__section--invite">
            <div className="customerDashboard__sectionHead">
              <span className="customerDashboard__icon customerDashboard__icon--soft" aria-hidden="true">✦</span>
              <div>
                <h3>새 커플룸 선물하기</h3>
                <p>새 고객에게 바로 전달할 수 있는 초대 정보를 만들어드려요.</p>
              </div>
            </div>
            <div className="row">
              <button className="btn btn--primary" type="button" onClick={handleCreate} disabled={busy}>{creating ? "준비 중..." : "새 커플룸 만들기"}</button>
              <button className="btn btn--soft" type="button" onClick={handleCopy} disabled={!result || busy}>안내 복사하기</button>
            </div>
            {result ? (
              <section className="customerDeliveryCard" aria-label="생성된 고객 접속 정보">
                <div className="customerDeliveryCard__hero">
                  <span className="customerDeliveryCard__mark" aria-hidden="true">♡</span>
                  <p>두 사람만의 공간이 준비되었어요</p>
                  <h4>{nameA} · {nameB}</h4>
                  <span>이제 고객에게 아래 초대 정보를 전해주면 바로 시작할 수 있어요.</span>
                </div>
                <div className="customerDeliveryCard__details">
                  <div><span>커플 코드</span><strong>{result.coupleCode}</strong></div>
                  <div><span>초대 비밀번호</span><strong>{result.adminPassword}</strong></div>
                  <div><span>보기 비밀번호</span><strong>{result.viewerPassword}</strong></div>
                  <div><span>앱 접속 링크</span><strong>{window.location.origin + window.location.pathname}</strong></div>
                </div>
                <div className="customerDeliveryCard__actions">
                  <button className="btn btn--primary" type="button" onClick={handleCopy}>초대 정보 복사</button>
                  <button className="btn btn--soft" type="button" onClick={() => void handleShare()}>공유하기</button>
                </div>
              </section>
            ) : null}
          </section>

          <p className={`customerDashboard__hint${status === "success" ? " customerDashboard__hint--success" : ""}${status === "error" ? " customerDashboard__hint--error" : ""}`}>{hint}</p>
        </div>
      ) : null}
    </article>
  );
}
