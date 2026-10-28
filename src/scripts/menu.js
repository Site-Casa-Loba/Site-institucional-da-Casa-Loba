// NAV FLUTUANTE: fica sólida ao rolar a página
const nav = document.getElementById("navFlutuante");

// Em páginas internas, o cabeçalho já começa e fica sempre sólido
if (nav && !nav.hasAttribute("data-sempre-solido")) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  });
}
