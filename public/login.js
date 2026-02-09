
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "Loading...";

    const email = document.getElementById("email")?.value?.trim() || "";
    const password = document.getElementById("password")?.value || "";

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (msg) msg.textContent = data.message || "Login failed";
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);
      if (msg) msg.textContent = "Login success! Redirecting...";

      window.location.replace("https://ventespro.streamlit.app");
    } catch {
      if (msg) msg.textContent = "Network error";
    }
  });
});
const forgotBtn = document.getElementById("forgotBtn");
const forgotBox = document.getElementById("forgotBox");

const stepEmail = document.getElementById("stepEmail");
const stepCode = document.getElementById("stepCode");
const stepReset = document.getElementById("stepReset");

const fpEmail = document.getElementById("fpEmail");
const fpCode = document.getElementById("fpCode");
const fpNewPass = document.getElementById("fpNewPass");
const fpMsg = document.getElementById("fpMsg");

let resetToken = null;

function showMsg(t) {
  if (fpMsg) fpMsg.textContent = t;
}

forgotBtn?.addEventListener("click", () => {
  forgotBox.style.display = forgotBox.style.display === "none" ? "block" : "none";
  showMsg("");
});

// Step 1: envoyer code
document.getElementById("sendCodeBtn")?.addEventListener("click", async () => {
  const email = (fpEmail.value || "").trim();
  if (!email) return showMsg("❌ Entrez votre email.");

  showMsg("⏳ Envoi du code...");
  const res = await fetch("/api/password/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return showMsg(data.message || "❌ Erreur d’envoi.");

  showMsg("✅ Code envoyé. Vérifiez votre email.");
  stepEmail.style.display = "none";
  stepCode.style.display = "block";
});

// Step 2: vérifier code
document.getElementById("verifyCodeBtn")?.addEventListener("click", async () => {
  const email = (fpEmail.value || "").trim();
  const code = (fpCode.value || "").trim();
  if (!code) return showMsg("❌ Entrez le code.");

  showMsg("⏳ Vérification...");
  const res = await fetch("/api/password/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return showMsg(data.message || "❌ Code invalide.");

  resetToken = data.token;
  showMsg("✅ Code vérifié. Vous pouvez changer le mot de passe.");
  stepCode.style.display = "none";
  stepReset.style.display = "block";
});

// Step 3: reset password
document.getElementById("resetPassBtn")?.addEventListener("click", async () => {
  const newPassword = fpNewPass.value || "";
  if (newPassword.length < 6) return showMsg("❌ Mot de passe min 6 caractères.");
  if (!resetToken) return showMsg("❌ Token manquant, recommencez.");

  showMsg("⏳ Mise à jour...");
  const res = await fetch("/api/password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetToken, newPassword }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return showMsg(data.message || "❌ Erreur reset.");

  showMsg("✅ Mot de passe changé. Vous pouvez vous connecter.");
  stepReset.style.display = "none";
});
