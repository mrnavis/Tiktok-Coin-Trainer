// Simple Gate v1 — Usuario/Contraseña en cliente (educativo)
(() => {
  const STORAGE_KEY = "gate_v1_ok";
  // 👉 Reemplaza por tu SHA-256 de "usuario:contraseña"
  const HASH = "95e86d32d93d6ef013ba3ddee5995ea3140935396cbdd18d7a148ab4e4f5704d";

  // Estilos del overlay
  const CSS = `
  .gate__backdrop{position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center}
  .gate__card{width:min(92vw,420px);background:#111;border:1px solid #262626;border-radius:14px;padding:22px;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.4)}
  .gate__title{font-weight:800;font-size:18px;margin:0 0 14px}
  .gate__row{display:flex;gap:10px;margin:10px 0}
  .gate__input{flex:1;background:#0f0f0f;border:1px solid #333;border-radius:10px;color:#fff;padding:10px 12px;font-size:14px}
  .gate__input::placeholder{color:#888}
  .gate__btn{background:#ff2e63;border:none;color:#fff;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer}
  .gate__btn:disabled{opacity:.7;cursor:not-allowed}
  .gate__err{color:#ff9aa8;font-size:12px;height:16px;margin-top:6px}
  .gate__hint{color:#aaa;font-size:12px;margin-top:10px}
  `;

  // Util: SHA-256 (hex)
  async function sha256Hex(text){
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function injectUI(){
    // estilos
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // overlay
    const wrap = document.createElement("div");
    wrap.className = "gate__backdrop";
    wrap.innerHTML = `
      <div class="gate__card">
        <div class="gate__title">Acceso</div>
        <form>
          <div class="gate__row">
            <input class="gate__input" name="u" placeholder="Usuario" autocomplete="username" />
          </div>
          <div class="gate__row">
            <input class="gate__input" name="p" type="password" placeholder="Contraseña" autocomplete="current-password" />
          </div>
          <div class="gate__row" style="justify-content:flex-end">
            <button class="gate__btn" type="submit">Entrar</button>
          </div>
          <div class="gate__err"></div>
          <div class="gate__hint">Protección educativa en cliente.</div>
        </form>
      </div>
    `;
    document.body.appendChild(wrap);

    const form = wrap.querySelector("form");
    const err = wrap.querySelector(".gate__err");
    form.addEventListener("submit", async (e)=>{
      e.preventDefault();
      err.textContent = "";
      const u = form.elements.u.value.trim();
      const p = form.elements.p.value;
      const h = await sha256Hex(`${u}:${p}`);
      if (h === HASH){
        localStorage.setItem(STORAGE_KEY,"ok");
        wrap.remove();
        document.dispatchEvent(new Event("auth-ok"));
      } else {
        err.textContent = "Usuario o contraseña incorrectos.";
      }
    });
  }

  function isUnlocked(){ return localStorage.getItem(STORAGE_KEY) === "ok"; }

  // Si no está desbloqueado, mostrar overlay
  window.addEventListener("DOMContentLoaded", ()=>{
    if (!isUnlocked()) injectUI();
  });

  // API para salir manualmente (desde consola: gateLogout())
  window.gateLogout = () => localStorage.removeItem(STORAGE_KEY);
})();
