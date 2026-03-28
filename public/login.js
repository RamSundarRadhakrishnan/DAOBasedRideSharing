(() => {
  const form = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const feedback = document.getElementById("login-feedback");

  const credentials = {
    ram: { password: "rider123", page: "./rider.html", label: "Rider" },
    asha: { password: "host123", page: "./host.html?host=asha", label: "Host" },
    farhan: { password: "host234", page: "./host.html?host=farhan", label: "Host" },
    meera: { password: "host345", page: "./host.html?host=meera", label: "Host" },
    kavya: { password: "host456", page: "./host.html?host=kavya", label: "Host" },
    ishan: { password: "arb123", page: "./arbitrator.html?arb=ishan", label: "Arbitrator" },
    admin: { password: "admin123", page: "./admin.html", label: "Admin" },
  };

  function setFeedback(message, state = "") {
    feedback.textContent = message;
    feedback.dataset.state = state;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const account = credentials[username];

    if (!account || account.password !== password) {
      setFeedback("Incorrect username or password.", "error");
      passwordInput.value = "";
      passwordInput.focus();
      return;
    }

    const openedTab = window.open(account.page, "_blank", "noopener,noreferrer");

    if (!openedTab) {
      setFeedback("The login matched, but the new tab was blocked by the browser.", "error");
      return;
    }

    setFeedback(`${account.label} workspace opened in a new tab.`, "success");
    form.reset();
    usernameInput.focus();
  });
})();


