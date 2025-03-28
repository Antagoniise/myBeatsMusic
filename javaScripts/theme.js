/**
 * Minified by jsDelivr using Terser v5.19.2.
 * Original file: /gh/mackenziechild/wfu3@master/js/theme.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
document.addEventListener("DOMContentLoaded", function () {
  const e = document.getElementById("toLightMode"),
    t = document.getElementById("toDarkMode"),
    o = document.getElementById("toLightModeMobile"),
    n = document.getElementById("toDarkModeMobile");
  // Adjust domain logic to include GitHub Pages domain
  let l = ["mybeats.cloud", "antagoniise.github.io"].includes(window.location.hostname) ? window.location.hostname : "mybeats.cloud";
  const d = (function () {
      document.cookie = "testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/";
      const e = -1 !== document.cookie.indexOf("testcookie");
      return (document.cookie = "testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/"), e;
    })(),
    i = () => Cookies.get("wfu-theme") || localStorage.getItem("theme"),
    s = (e) => {
      try {
        Cookies.set("wfu-theme", e, { expires: 365, domain: l });
      } catch (t) {
        localStorage.setItem("theme", e);
      }
    },
    a = localStorage.getItem("theme");
  a && d && (s(a), localStorage.removeItem("theme"));
  const c = (l) => {
      window.innerWidth > 768
        ? "light" === l
          ? ((t.style.display = "flex"), (n.style.display = "flex"), (e.style.display = "none"), (o.style.display = "none"))
          : ((t.style.display = "none"), (n.style.display = "none"), (e.style.display = "flex"), (o.style.display = "flex"))
        : ("light" === l ? ((n.style.display = "flex"), (o.style.display = "none")) : ((n.style.display = "none"), (o.style.display = "flex")), (t.style.display = "none"), (e.style.display = "none"));
    },
    y = (e) => {
      document.documentElement.setAttribute("data-theme", e), s(e), c(e);
    },
    m = (e, t) => {
      e.addEventListener("click", () => {
        setTimeout(() => {
          y(t);
        }, 380);
      });
    };
  y(i() || "dark"),
    m(e, "light"),
    m(t, "dark"),
    m(o, "light"),
    m(n, "dark"),
    window.addEventListener("resize", () => {
      const e = i() || "dark";
      c(e);
    });
});
//# sourceMappingURL=/sm/fe2ab98e441dacd974950013276fd0b09e894ce4815369f3c0ecd3d32fae42f9.map
