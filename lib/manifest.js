/* lib/manifest.js — dados da marca. Não editar produtos aqui: eles vivem em
   datos/productos.json e chegam ao site via lib/db.js (gerado pelo build). */
(function () {
  "use strict";
  window.__BRAND__ = {
    nome: "CompraCerta",
    tagline: "Compare produtos e compre com confiança em sites confiáveis",
    descricaoSite: "Fichas técnicas, comparador lado a lado e guias de compra para você escolher com segurança — e comprar em marketplaces confiáveis, como o Mercado Livre.",
    contatoEmail: "contato@compracerta.com.br",
    ano: 2026,
    maxComparador: 4,
    nav: [
      { href: "index.html", label: "Início" },
      { href: "categoria-urbana.html", label: "Urbanas" },
      { href: "categoria-dobravel.html", label: "Dobráveis" },
      { href: "categoria-trekking-montanha.html", label: "Trekking/Montanha" },
      { href: "ofertas.html", label: "Ofertas" },
      { href: "guia-melhor-bicicleta-eletrica-cidade-2026.html", label: "Guia de compra" },
      { href: "comparador.html", label: "Comparador", cta: true }
    ]
  };
})();
