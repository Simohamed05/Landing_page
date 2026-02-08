document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const msg = document.getElementById("contactMsg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    msg.textContent = "Envoi en cours...";

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        msg.textContent = data.message || "Erreur";
        return;
      }

      msg.textContent = "✅ Message envoyé !";
      form.reset();

    } catch (err) {
      msg.textContent = "❌ Erreur réseau";
    }
  });
});
