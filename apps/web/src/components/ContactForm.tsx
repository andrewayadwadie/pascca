"use client";

// US3: React Hook Form + Zod, submits nowhere (FR-033). TODO(F12): wire this to
// POST /api/v1/contact-messages once that endpoint exists; do not invent one here.
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Form } from "./Form";
import { Field } from "./Field";
import { ResultBox } from "./ResultBox";
import { Button } from "./Button";
import { contactSchema, type ContactValues } from "../lib/validation/contact";

export function ContactForm() {
  const t = useTranslations("forms");
  const [result, setResult] = useState<{ state: "idle" | "confirmed" | "call-required"; message: string }>({
    state: "idle",
    message: "",
  });

  function onSubmit(values: ContactValues) {
    setResult({ state: "confirmed", message: t("contactConfirmedMessage", { name: values.name }) });
  }

  return (
    <Form<ContactValues> onSubmit={onSubmit} resolver={zodResolver(contactSchema)}>
      <Field name="name" label={t("fullName")} placeholder={t("namePlaceholder")} required />
      <Field name="phone" label={t("mobile")} type="tel" placeholder={t("mobilePlaceholder")} required />
      <Field name="email" label={t("email")} type="email" placeholder={t("emailPlaceholder")} />
      <Field
        name="subject"
        label={t("subject")}
        as="select"
        options={["General enquiry", "Feedback on a visit", "Private event", "Delivery issue", "Careers", "Press & partnerships"]}
      />
      <Field name="message" label={t("message")} as="textarea" placeholder={t("messagePlaceholder")} wide required />
      <Button variant="gold" size="md" type="submit">
        {t("sendMessage")}
      </Button>
      <ResultBox state={result.state} message={result.message} />
    </Form>
  );
}
