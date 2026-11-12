"use client";
import { useActionState } from "react";
import { saveProfile } from "./actions";

export default function OnboardingForm({ next, icName, passport }: { next: string; icName: string; passport: string }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="next" value={next} />
      <div className="grid">
        <label className="lbl">Имя Фамилия (IC)<input className="inp" name="icName" defaultValue={icName} placeholder="Sidni Preskot" required /></label>
        <label className="lbl">Номер паспорта<input className="inp" name="passport" defaultValue={passport} placeholder="83284" inputMode="numeric" required /></label>
      </div>
      {state.error && <div className="err">{state.error}</div>}
      <div><button className="btn" type="submit" disabled={pending}>{pending ? "Сохраняю…" : "Сохранить и войти"}</button></div>
    </form>
  );
}
