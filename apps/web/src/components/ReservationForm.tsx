"use client";

// US3: React Hook Form + Zod, submits nowhere (FR-033). Party size ≤6 → instant confirmation;
// >6 → call-back-required (FR-034). Real bookings connect to the backend and dashboard in a
// later feature — TODO(F10, F12): wire this to POST /api/v1/reservations once that endpoint
// exists; do not invent one here.
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Form } from "./Form";
import { Field } from "./Field";
import { ResultBox } from "./ResultBox";
import { Button } from "./Button";
import { reservationSchema, type ReservationValues } from "../lib/validation/reservation";

export function ReservationForm({ branchOptions }: { branchOptions: string[] }) {
  const t = useTranslations("forms");
  const [result, setResult] = useState<{ state: "idle" | "confirmed" | "call-required"; message: string }>({
    state: "idle",
    message: "",
  });

  function onSubmit(values: ReservationValues) {
    const ref = `PSC-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    if (values.size > 6) {
      setResult({ state: "call-required", message: t("callRequiredMessage", { name: values.name, ref }) });
    } else {
      setResult({ state: "confirmed", message: t("confirmedMessage", { name: values.name, ref }) });
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  return (
    <Form<ReservationValues>
      onSubmit={onSubmit}
      resolver={zodResolver(reservationSchema)}
      defaultValues={{ branch: branchOptions[0] ?? "", date: defaultDate, time: "20:00", size: 2 }}
    >
      <Field name="name" label={t("fullName")} placeholder={t("namePlaceholder")} required />
      <Field name="phone" label={t("mobile")} type="tel" placeholder={t("mobilePlaceholder")} required />
      <Field name="email" label={t("email")} type="email" placeholder={t("emailPlaceholder")} />
      <Field name="branch" label={t("branch")} as="select" options={branchOptions} />
      <Field name="date" label={t("date")} type="date" />
      <Field name="time" label={t("time")} type="time" />
      <Field name="size" label={t("guests")} as="select" options={["2", "3", "4", "5", "6", "8", "10", "12"]} />
      <Field
        name="occasion"
        label={t("occasion")}
        as="select"
        options={["No occasion", "Birthday", "Engagement", "Anniversary", "Business", "Family gathering"]}
      />
      <Field name="notes" label={t("notes")} as="textarea" placeholder={t("notesPlaceholder")} wide />
      <Button variant="gold" size="md" type="submit">
        {t("confirmReservation")}
      </Button>
      <ResultBox state={result.state} message={result.message} />
      <p className="f w" style={{ fontSize: "11.5px", color: "var(--w20)", lineHeight: 1.7 }}>
        {t("privacyNoticePre")} <a href="/legal">{t("privacyNoticeLink")}</a>
      </p>
    </Form>
  );
}
