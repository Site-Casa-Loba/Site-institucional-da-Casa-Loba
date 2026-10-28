// MODAIS: abertura e fechamento dos modais de login e cadastro (<dialog>)
// - [data-abrir-modal="id"] abre o modal com esse id, fechando o que estiver aberto
// - [data-fechar-modal] fecha o modal em que está
// - clique no fundo escurecido fecha; o Esc já é nativo do <dialog>

// Guarda onde o clique começou, para não fechar quando a pessoa arrasta
// de dentro da caixa (ex.: selecionando texto) e solta no fundo
let inicioDoClique = null;

document.addEventListener("pointerdown", (evento) => {
  inicioDoClique = evento.target;
});

document.addEventListener("click", (evento) => {
  const alvo = evento.target;
  if (!(alvo instanceof Element)) return;

  const abrir = alvo.closest("[data-abrir-modal]");
  if (abrir) {
    document.querySelector("dialog.modal[open]")?.close();
    document.getElementById(abrir.dataset.abrirModal)?.showModal();
    return;
  }

  if (alvo.closest("[data-fechar-modal]")) {
    alvo.closest("dialog")?.close();
    return;
  }

  // Clique no fundo: o alvo é o próprio <dialog>, fora da caixa
  if (alvo instanceof HTMLDialogElement && alvo.classList.contains("modal") && inicioDoClique === alvo) {
    alvo.close();
    return;
  }

  // PLACEHOLDER: links ainda sem destino, como "Esqueci minha senha"
  if (alvo.closest("[data-link-placeholder]")) {
    evento.preventDefault();
  }
});

// PLACEHOLDER: os formulários ainda não enviam nada, só impedem o recarregamento
document.addEventListener("submit", (evento) => {
  if (evento.target instanceof HTMLFormElement && evento.target.hasAttribute("data-form-placeholder")) {
    evento.preventDefault();
  }
});
