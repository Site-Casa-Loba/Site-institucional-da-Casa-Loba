/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Presente quando há sessão de membro válida (ou renovada) — ver src/middleware.ts */
    membro?: boolean;
  }
}
