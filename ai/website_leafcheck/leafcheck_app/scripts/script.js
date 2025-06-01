document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("mainContent");

  function setupPredictPage() {
    const imageUpload = document.getElementById("imageUpload");
    const imagePreview = document.getElementById("imagePreview");
    const predictBtn = document.getElementById("predictBtn");
    const resultContainer = document.getElementById("predictionResult");

    if (!imageUpload || !imagePreview || !predictBtn || !resultContainer) {
      // Elements not found - probably not on predict page
      return;
    }

    imageUpload.addEventListener("change", () => {
      const file = imageUpload.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
          predictBtn.disabled = false;
          resultContainer.textContent = "";
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = "none";
        predictBtn.disabled = true;
      }
    });

    predictBtn.addEventListener("click", () => {
      resultContainer.textContent = "Prediction logic will be added here!";
    });
  }

  function loadPage(page) {
    fetch(`content/${page}.html`)
      .then((response) => response.text())
      .then((html) => {
        mainContent.innerHTML = html;

        // If loaded page is predict, setup event listeners
        if (page === "predict") {
          setupPredictPage();
        }
      })
      .catch((error) => {
        mainContent.innerHTML = "<p>Error loading content.</p>";
        console.error("Error loading page:", error);
      });
  }

  document.getElementById("homeLink").addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("home");
    setActiveLink("homeLink");
  });

  document.getElementById("aboutLink").addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("about");
    setActiveLink("aboutLink");
  });

  document.getElementById("predictLink").addEventListener("click", (e) => {
    e.preventDefault();
    loadPage("predict");
    setActiveLink("predictLink");
  });

  // Load default page on first load
  loadPage("home");
  setActiveLink("homeLink");
});

// Add active class to current menu to highlight the current tab
function setActiveLink(id) {
  document.querySelectorAll("nav a").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}
