const form = document.querySelector("#loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.ok) {
    // optional: stocker token
    localStorage.setItem("token", data.token);

    // redirect direct vers Streamlit
    window.location.href = data.redirectTo || "https://ventespro.streamlit.app";
  } else {
    alert(data.message || "Login failed");
  }
});
