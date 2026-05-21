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

function formatCount(value: number | null) {
  return typeof value === "number" ? `${value.toLocaleString("ko-KR")}개` : "-";
}

function formatUpdatedAt(value: number | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function roomStatusLabel(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["test", "testing", "테스트"].includes(normalized)) return "테스트";
  if (["inactive", "disabled", "archived", "비활성"].includes(normalized)) return "비활성";
  return "운영 중";
}

function saveStateLabel(state: "unchanged" | "dirty" | "saved" | "error") {
  if (state === "dirty") return "저장 전 변경 있음";
  if (state === "saved") return "저장 완료";
  if (state === "error") return "저장 실패";
  return "변경 없음";
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
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showViewerPassword, setShowViewerPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<ProvisionedCustomerRoom | null>(null);
  const [hint, setHint] = useState("고객의 커플룸을 따뜻하게 준비하고 안전하게 관리할 수 있어요.");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const deliveryText = useMemo(() => result ? credentialText(result) : "", [result]);
  const summary = useMemo(() => memberSummary(snapshot), [snapshot]);
  const busy = loadingSnapshot || saving || exporting || creating;
  const hasUnsavedChanges = useMemo(() => {
    const sourceNameA = snapshot?.nameA || couple.nameA;
    const sourceNameB = snapshot?.nameB || couple.nameB;
    const sourceStartDate = toISODateInputValue(snapshot?.startDate || couple.startDate);
    return nameA !== sourceNameA || nameB !== sourceNameB || startDate !== sourceStartDate || Boolean(adminPassword || viewerPassword);
  }, [adminPassword, couple.nameA, couple.nameB, couple.startDate, nameA, nameB, snapshot, startDate, viewerPassword]);
  const saveState = status === "error" ? "error" : hasUnsavedChanges ? "dirty" : status === "success" ? "saved" : "unchanged";
  const operationalInfo = snapshot?.operationalInfo;
  const metricItems = useMemo(() => [
    { label: "사진", value: formatCount(operationalInfo?.photoCount ?? null) },
    { label: "메모", value: formatCount(operationalInfo?.memoCount ?? null) },
    { label: "캘린더", value: formatCount(operationalInfo?.diaryCount ?? null) },
    { label: "음악", value: formatCount(operationalInfo?.musicCount ?? null) },
  ], [operationalInfo]);
  const currentRoom = useMemo(() => ({
    coupleCode: roomId || "",
    nameA,
    nameB,
    status: roomStatusLabel(snapshot?.status),
    lastUpdated: formatUpdatedAt(snapshot?.operationalInfo.lastUpdatedAt ?? null),
    metrics: [
      { label: "사진", value: formatCount(snapshot?.operationalInfo.photoCount ?? null) },
      { label: "메모", value: formatCount(snapshot?.operationalInfo.memoCount ?? null) },
      { label: "일정", value: formatCount(snapshot?.operationalInfo.diaryCount ?? null) },
    ],
  }), [nameA, nameB, roomId, snapshot]);
  const createdRoom = useMemo(() => result ? {
    coupleCode: result.coupleCode,
    nameA: couple.nameA,
    nameB: couple.nameB,
    status: "테스트",
    lastUpdated: "-",
    metrics: [
      { label: "사진", value: "-" },
      { label: "메모", value: "-" },
      { label: "일정", value: "-" },
    ],
  } : null, [couple.nameA, couple.nameB, result]);
  const visibleRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return [currentRoom, createdRoom].filter((room): room is typeof currentRoom => {
      if (!room) return false;
      if (!keyword) return true;
      return `${room.nameA} ${room.nameB} ${room.coupleCode}`.toLowerCase().includes(keyword);
    });
  }, [createdRoom, currentRoom, search]);

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
    setHint("저장 중...");
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
      setHint("저장됐어요. 고객 커플룸 정보가 최신 상태입니다.");
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
          <p className="hint">운영 중인 고객 공간을 확인하고 필요한 정보만 관리해요.</p>
        </div>
        <button className="btn btn--primary" type="button" onClick={() => setOpen((value) => !value)} disabled={busy}>
          {open ? "접기" : "커플룸 관리"}
        </button>
      </div>

      {open ? (
        <div className="customerDashboard__body" aria-busy={busy ? "true" : "false"}>
          {loadingSnapshot ? <p className="hint loadingHint">커플룸 정보를 불러오는 중...</p> : null}

          <div className="customerDashboard__grid">
            <section className="customerDashboard__section customerDashboard__section--list">
              <div className="customerDashboard__sectionHead">
                <span className="customerDashboard__icon customerDashboard__icon--soft" aria-hidden="true">＋</span>
                <div>
                  <h3>고객 목록</h3>
                  <p>현재 관리 가능한 커플룸을 이름 또는 코드로 찾을 수 있어요.</p>
                </div>
              </div>
              <label className="label customerDashboard__search">고객 검색<input className="input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="커플 이름 또는 커플 코드" disabled={busy} /></label>
              <div className="customerDashboard__list">
                {visibleRooms.length > 0 ? visibleRooms.map((room) => (
                  <div className="customerCard" key={room.coupleCode || `${room.nameA}-${room.nameB}`}>
                    <div className="customerCard__top">
                      <span className="customerCard__label">커플룸</span>
                      <span className={`customerCard__badge customerCard__badge--${room.status === "비활성" ? "inactive" : room.status === "테스트" ? "test" : "active"}`}>{room.status}</span>
                    </div>
                    <strong>{room.nameA} · {room.nameB}</strong>
                    <small>{room.coupleCode || "-"}</small>
                    <div className="customerCard__meta">
                      <span>업데이트 {room.lastUpdated}</span>
                    </div>
                    <div className="customerCard__stats">
                      {room.metrics.map((item) => <span key={item.label}>{item.label} <b>{item.value}</b></span>)}
                    </div>
                  </div>
                )) : <p className="customerDashboard__empty">검색 결과가 없습니다.</p>}
              </div>
            </section>

          <section className="customerDashboard__section customerDashboard__section--featured">
            <div className="customerDashboard__sectionHead">
              <span className="customerDashboard__icon" aria-hidden="true">♡</span>
              <div>
                <h3>현재 커플룸</h3>
                <p>{nameA}와 {nameB}의 운영 정보를 확인하고 관리해요.</p>
              </div>
            </div>

            <div className="customerDashboard__statusRow">
              <div className={`customerDashboard__state customerDashboard__state--${saveState}`}>
                <span>저장 상태</span>
                <strong>{saveStateLabel(saveState)}</strong>
              </div>
              <div className="customerDashboard__state customerDashboard__state--updated">
                <span>마지막 업데이트</span>
                <strong>{formatUpdatedAt(snapshot?.operationalInfo.lastUpdatedAt ?? null)}</strong>
              </div>
              <div className={`customerDashboard__state customerDashboard__state--${currentRoom.status === "비활성" ? "inactive" : currentRoom.status === "테스트" ? "test" : "active"}`}>
                <span>룸 상태</span>
                <strong>{currentRoom.status}</strong>
              </div>
            </div>

            <div className="customerDashboard__metricChips">
              {metricItems.map((item) => (
                <div className="customerDashboard__metricChip" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="customerDashboard__stats">
              <div><span>커플</span><strong>{nameA} · {nameB}</strong></div>
              <div><span>커플 코드</span><strong>{roomId || "-"}</strong></div>
              <div><span>처음 만난 날</span><strong>{startDate}</strong></div>
              <div><span>함께 들어온 사람</span><strong>관리 {summary.admins}명 · 보기 {summary.viewers}명</strong></div>
            </div>

            <form className="form customerDashboard__form" onSubmit={handleSave}>
              <label className="label">첫 번째 이름<input className="input" type="text" maxLength={8} value={nameA} onChange={(event) => setNameA(event.target.value)} disabled={busy} /></label>
              <label className="label">두 번째 이름<input className="input" type="text" maxLength={8} value={nameB} onChange={(event) => setNameB(event.target.value)} disabled={busy} /></label>
              <label className="label">우리 시작일<input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={busy} /></label>
              <label className="label customerDashboard__passwordLabel">
                관리자 초대 비밀번호
                <span className="customerDashboard__passwordWrap">
                  <input className="input" type={showAdminPassword ? "text" : "password"} value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder={snapshot?.hasAdminPassword ? "바꿀 때만 입력" : "새 비밀번호"} disabled={busy} autoComplete="new-password" />
                  <button className="customerDashboard__toggle" type="button" onClick={() => setShowAdminPassword((value) => !value)} disabled={busy} aria-label={showAdminPassword ? "관리자 비밀번호 숨기기" : "관리자 비밀번호 보기"}>{showAdminPassword ? "숨김" : "보기"}</button>
                </span>
                <small>비워두면 기존 비밀번호를 유지합니다.</small>
              </label>
              <label className="label customerDashboard__passwordLabel">
                보기 전용 비밀번호
                <span className="customerDashboard__passwordWrap">
                  <input className="input" type={showViewerPassword ? "text" : "password"} value={viewerPassword} onChange={(event) => setViewerPassword(event.target.value)} placeholder={snapshot?.hasViewerPassword ? "바꿀 때만 입력" : "새 비밀번호"} disabled={busy} autoComplete="new-password" />
                  <button className="customerDashboard__toggle" type="button" onClick={() => setShowViewerPassword((value) => !value)} disabled={busy} aria-label={showViewerPassword ? "보기 비밀번호 숨기기" : "보기 비밀번호 보기"}>{showViewerPassword ? "숨김" : "보기"}</button>
                </span>
                <small>비워두면 기존 비밀번호를 유지합니다.</small>
              </label>
              <div className="row">
                <button className="btn btn--primary" type="submit" disabled={busy || !hasUnsavedChanges}>{saving ? "저장 중..." : "커플룸 저장"}</button>
                <button className="btn btn--soft" type="button" onClick={handleExport} disabled={busy}>{exporting ? "내보내는 중..." : "기록 내보내기"}</button>
              </div>
            </form>
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
          </div>

          <p className={`customerDashboard__hint customerDashboard__hint--${saveState}${status === "success" ? " customerDashboard__hint--success" : ""}${status === "error" ? " customerDashboard__hint--error" : ""}`}>{hint}</p>
        </div>
      ) : null}
    </article>
  );
}
