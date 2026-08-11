"use client";

// .frm — React Hook Form provider wrapper (contracts/component-api.md, US3). `resolver`/
// `defaultValues` are additive to the frozen `onSubmit`/`children` pair — there is no path to
// Zod validation (FR-033/FR-034) without them, and adding optional props doesn't break the
// signature anyone is calling with just onSubmit+children today.
//
// RHF's own generics don't compose cleanly through a second, independently-generic wrapper
// under `exactOptionalPropertyTypes` — the casts below are contained to this one pass-through
// call; every call site (ReservationForm, ContactForm) stays fully typed against its own Zod
// schema.
import { FormProvider, useForm } from "react-hook-form";
import type { DefaultValues, FieldValues, Resolver, SubmitHandler, UseFormProps } from "react-hook-form";
import type { ReactNode } from "react";

export interface FormProps<T extends FieldValues> {
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
  resolver?: Resolver<T>;
  defaultValues?: DefaultValues<T>;
}

export function Form<T extends FieldValues>({ onSubmit, children, resolver, defaultValues }: FormProps<T>) {
  const options: UseFormProps<T> = {};
  if (resolver) options.resolver = resolver;
  if (defaultValues) options.defaultValues = defaultValues;
  const methods = useForm<T>(options);
  const submit = methods.handleSubmit(onSubmit as SubmitHandler<FieldValues>);

  return (
    <FormProvider {...methods}>
      <form className="frm" onSubmit={submit} noValidate>
        {children}
      </form>
    </FormProvider>
  );
}
