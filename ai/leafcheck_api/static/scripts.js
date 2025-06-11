const uploadInput = document.getElementById("upload");
const preview = document.getElementById("preview");
const predictButton = document.getElementById("predictButton");
const result = document.getElementById("result");
const confidence = document.getElementById("confidence");

let currentImageDataURL = null;

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      preview.src = event.target.result;
      currentImageDataURL = event.target.result;
      predictButton.disabled = false;
    };
    reader.readAsDataURL(file);
  }
});

predictButton.addEventListener("click", async () => {
  if (!currentImageDataURL) return;

  result.textContent = "🌱 Detected: ...";
  confidence.textContent = "🔍 Confidence: ...";
  predictButton.disabled = true;
  predictButton.textContent = "Predicting...";

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: currentImageDataURL }),
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    result.textContent = `🌱 Detected: ${data.class}`;
    confidence.textContent = `🔍 Confidence: ${(data.confidence * 100).toFixed(2)}%`;
  } catch (err) {
    alert("Prediction error: " + err.message);
  } finally {
    predictButton.disabled = false;
    predictButton.textContent = "Predict";
  }
});
