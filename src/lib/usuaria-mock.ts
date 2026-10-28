import type { PlanoMembroId } from "./membros";

export interface Usuaria {
  nome: string;
  imagem?: string;
  email: string;
  plano: PlanoMembroId;
}

export const usuariaMock: Usuaria = {
  nome: "Larissa",
  email: "exemploemail@gmail.com",
  plano: "loba",
};
