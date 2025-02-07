/**
 *
 * 
 * Rwsesponsible for Mobile and Desktop Sidebar 
 * 
 **/
document.addEventListener("DOMContentLoaded", function () {
  const e = document.querySelector(".sidebar"),
    t = document.getElementById("mobile-menu"),
    o = document.querySelector(".sidebar_mobile-wrap"),
    i = document.getElementById("mobileBgClose");
  e.classList.add("no-transition");
  let s = "wfu3.webflow.io" === window.location.hostname ? "wfu3.webflow.io" : ".webflow.com";
  const n = (function () {
      document.cookie = "testcookie=1; expires=Wed, 01-Jan-2070 00:00:01 GMT; path=/";
      const e = -1 !== document.cookie.indexOf("testcookie");
      return (document.cookie = "testcookie=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/"), e;
    })(),
    d = () => Cookies.get("wfu-sidebarState") || localStorage.getItem("sidebarState"),
    c = (e) => {
      try {
        Cookies.set("wfu-sidebarState", e, { expires: 365, domain: s });
      } catch (t) {
        localStorage.setItem("sidebarState", e);
      }
    },
    r = localStorage.getItem("sidebarState");
  r && n && (c(r), localStorage.removeItem("sidebarState"));
  const l = d();
  function a() {
    (e.style.transition = "none"),
      (e.style.overflow = "hidden"),
      e.offsetWidth,
      (e.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)"),
      e.classList.toggle("opened"),
      e.classList.contains("opened") ? c("opened") : c("minimized"),
      setTimeout(() => {
        (e.style.overflow = ""), (e.style.transition = "");
      }, 600);
  }
  let u;
  "opened" === l ? e.classList.add("opened") : null === l && (e.classList.add("opened"), c("opened")),
    (document.documentElement.style.visibility = ""),
    setTimeout(function () {
      e.classList.remove("no-transition");
    }, 350),
    setTimeout(function () {
      const e = document.querySelectorAll(".sidebar .sidebar_link-text, .sidebar .sidebar_title, .sidebar .wf_wordmark"),
        t = document.querySelector(".sidebar_footer");
      e.forEach((e) => {
        e.style.transition =
          "opacity 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), visibility 0.01s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), max-height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), margin 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)";
      }),
        (t.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88), height 0.35s 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)");
    }, 10),
    document.getElementById("sidebar-close").addEventListener("click", function () {
      a();
    }),
    document.addEventListener("keydown", function (e) {
      e.metaKey && "/" === e.key && a();
    }),
    window.addEventListener("resize", function () {
      clearTimeout(u),
        (u = setTimeout(() => {
          const t = d();
          window.innerWidth < 1296 && "opened" === t
            ? ((e.style.overflow = "hidden"),
              (e.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)"),
              e.classList.remove("opened"),
              setTimeout(() => {
                (e.style.overflow = ""), (e.style.transition = "");
              }, 600))
            : window.innerWidth > 1296 &&
              "opened" === t &&
              ((e.style.overflow = "hidden"),
              (e.style.transition = "width 0.35s cubic-bezier(0.8, 0.1, 0.38, 0.88)"),
              e.classList.add("opened"),
              setTimeout(() => {
                (e.style.overflow = ""), (e.style.transition = "");
              }, 600));
        }, 200));
    }),
    window.innerWidth < 1296 && "opened" === d() && e.classList.remove("opened"),
    t.addEventListener("click", function () {
      o.classList.toggle("opened"),
        i.classList.toggle("opened"),
        t.classList.toggle("u-bgc-2"),
        window.innerWidth < 768 && ("hidden" !== document.body.style.overflow ? (document.body.style.overflow = "hidden") : (document.body.style.overflow = "auto"));
    }),
    i.addEventListener("click", function () {
      o.classList.remove("opened"),
        i.classList.remove("opened"),
        t.classList.toggle("u-bgc-2"),
        setTimeout(() => {
          window.Webflow && window.Webflow.require("ix2").init();
        }, 250),
        "hidden" === document.body.style.overflow && (document.body.style.overflow = "auto");
    });
}),
  (window.onload = function () {
    const e = window.location.pathname;
    document.querySelectorAll(".sidebar_link-group").forEach((t) => {
      const o = t.getAttribute("href");
      ("/" === o && "/" === e) || (e.startsWith("/course-lesson/") && "/courses" === o) || (e.startsWith("/lesson/") && "/docs" === o) || ("/" !== o && -1 !== e.indexOf(o)) ? t.classList.add("w--current") : t.classList.remove("w--current");
    });
  });
//# sourceMappingURL=/sm/08877b58468835dfa88d95313d271d2a91fb6f8c50304b0cb7848b8f1f0d3f22.map
