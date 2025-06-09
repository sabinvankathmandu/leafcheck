let model, webcam, maxPredictions;

const modelURL = "model/model.json";
const metadataURL = "model/metadata.json";

const uploadInput = document.getElementById("upload");
const preview = document.getElementById("preview");
const previewMobile = document.getElementById("previewMobile");

const uploadFromGalleryBtn = document.getElementById("uploadFromGalleryBtn");
const takePictureBtn = document.getElementById("takePictureBtn");
const mobileUploadInput = document.getElementById("mobileUpload");

const webcamSection = document.getElementById("webcamSection");
const cameraSelect = document.getElementById("cameraSelect");
const webcamButton = document.getElementById("webcamButton");
const stopWebcamButton = document.getElementById("stopWebcamButton");
const webcamContainer = document.getElementById("webcam-container");

const predictButton = document.getElementById("predictButton");
const result = document.getElementById("result");
const confidence = document.getElementById("confidence");

const moreInfoButton = document.getElementById("moreInfoButton");
const extraInfo = document.getElementById("extraInfo");
const symptomsSpan = document.getElementById("symptoms");
const solutionsSpan = document.getElementById("solutions");
const medicinesSpan = document.getElementById("medicines");
const remediesSpan = document.getElementById("remedies");

let currentImageDataURL = null;

const diseaseInfo = {
  "Tomato - Bacterial Spots": {
    symptoms: "White powdery spots on leaves and stems.",
    solutions: "Improve air circulation and reduce humidity.",
    medicines: "Use fungicides like sulfur or neem oil.",
    remedies: "Spray with baking soda and water mixture.",
  },
  "Leaf Spot": {
    symptoms: "Brown or black spots on leaves.",
    solutions: "Remove infected leaves and avoid overhead watering.",
    medicines: "Apply copper-based fungicides.",
    remedies: "Use chamomile tea as a natural spray.",
  },
  "Potato_Late Blight": {
  symptoms: "Dark brown to black lesions on leaves and stems, often with a pale green or yellow halo. White fungal growth may appear under leaves in humid conditions. Tubers develop sunken brown spots and may rot internally.",
  solutions: "Use certified disease-free seeds, destroy infected plants and debris, rotate crops, and ensure proper air circulation. Avoid overhead irrigation.",
  medicines: "Apply fungicides such as copper-based sprays, Cyazofamid (Ranman), Dimethomorph (Forum), or Mefenoxam (Ridomil Gold). Rotate fungicides to prevent resistance.",
  remedies: "Spray with organic treatments like chamomile tea or garlic extract. Use bio-fungicides such as Bacillus subtilis (e.g., Serenade). Ensure dry foliage by watering early in the day."
}
  // we gonna add more class for moore disease as per needed
};

async function loadModel() {
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  console.log("Model loaded.");
}

function resetPrediction() {
  result.textContent = "🌱 Detected: -";
  confidence.textContent = "🔍 Confidence: -";
  predictButton.disabled = true;
  moreInfoButton.style.display = "none";
  extraInfo.style.display = "none";
}

function enablePredictButton() {
  predictButton.disabled = false;
}

function disablePredictButton() {
  predictButton.disabled = true;
}

// Desktop Upload handler
uploadInput.addEventListener("change", (e) => {
  resetPrediction();
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      preview.src = event.target.result;
      currentImageDataURL = event.target.result;
      enablePredictButton();
    };
    reader.readAsDataURL(file);
  }
});

// Mobile upload from gallery button
uploadFromGalleryBtn.addEventListener("click", () => {
  mobileUploadInput.removeAttribute("capture");
  mobileUploadInput.click();
});

// Mobile take picture button
takePictureBtn.addEventListener("click", () => {
  mobileUploadInput.setAttribute("capture", "environment");
  mobileUploadInput.click();
});

mobileUploadInput.addEventListener("change", (e) => {
  resetPrediction();
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewMobile.src = event.target.result;
      currentImageDataURL = event.target.result;
      enablePredictButton();
    };
    reader.readAsDataURL(file);
  }
});

// Webcam functions
async function setupWebcam() {
  if (webcam) return;

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");

  cameraSelect.innerHTML = "";
  videoDevices.forEach((device, i) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text = device.label || `Camera ${i + 1}`;
    cameraSelect.appendChild(option);
  });

  const selectedDeviceId = cameraSelect.value;

  webcam = new tmImage.Webcam(300, 300, true);
  await webcam.setup({ deviceId: selectedDeviceId });
  await webcam.play();
  webcamContainer.appendChild(webcam.canvas);

  webcamButton.disabled = true;
  stopWebcamButton.disabled = false;
  disablePredictButton();

  window.requestAnimationFrame(webcamLoop);
}

function stopWebcam() {
  if (!webcam) return;
  webcam.stop();
  webcamContainer.removeChild(webcam.canvas);
  webcam = null;
  webcamButton.disabled = false;
  stopWebcamButton.disabled = true;
  disablePredictButton();
  resetPrediction();
}

async function webcamLoop() {
  if (webcam) {
    webcam.update();
    window.requestAnimationFrame(webcamLoop);
  }
}

cameraSelect.addEventListener("change", async () => {
  if (webcam) {
    stopWebcam();
    await setupWebcam();
  }
});

webcamButton.addEventListener("click", async () => {
  await setupWebcam();
});

stopWebcamButton.addEventListener("click", () => {
  stopWebcam();
});

function getWebcamImage() {
  if (!webcam) return null;
  return webcam.canvas;
}

// Predict button click handler
predictButton.addEventListener("click", async () => {
  if (!currentImageDataURL && !webcam) {
    alert("Please upload, take a picture, or use the webcam first.");
    return;
  }

  predictButton.disabled = true;
  predictButton.textContent = "Predicting...";
  moreInfoButton.style.display = "none"; // hide by default
  extraInfo.style.display = "none"; // hide extra info on new prediction

  try {
    let imgElement;

    if (webcam) {
      imgElement = getWebcamImage();
    } else {
      imgElement = new Image();
      imgElement.src = currentImageDataURL;
      await new Promise((res) => (imgElement.onload = res));
    }

    const prediction = await model.predict(imgElement);

    let highestProb = 0;
    let predictedClass = "Unknown";

    prediction.forEach((p) => {
      if (p.probability > highestProb) {
        highestProb = p.probability;
        predictedClass = p.className;
      }
    });

    result.textContent = `🌱 Detected: ${predictedClass}`;
    confidence.textContent = `🔍 Confidence: ${(highestProb * 100).toFixed(2)}%`;

    // Show "Display More" button only if infected and info exists
    if (predictedClass !== "Healthy" && diseaseInfo[predictedClass]) {
      moreInfoButton.style.display = "inline-block";
      moreInfoButton.dataset.currentClass = predictedClass;
    } else {
      moreInfoButton.style.display = "none";
      extraInfo.style.display = "none";
    }
  } catch (error) {
    alert("Prediction failed: " + error.message);
  } finally {
    predictButton.disabled = false;
    predictButton.textContent = "Predict";
  }
});

// More Info button click handler to toggle extra info
moreInfoButton.addEventListener("click", () => {
  const disease = moreInfoButton.dataset.currentClass;
  if (!disease || !diseaseInfo[disease]) return;

  symptomsSpan.textContent = diseaseInfo[disease].symptoms || "N/A";
  solutionsSpan.textContent = diseaseInfo[disease].solutions || "N/A";
  medicinesSpan.textContent = diseaseInfo[disease].medicines || "N/A";
  remediesSpan.textContent = diseaseInfo[disease].remedies || "N/A";

  if (extraInfo.style.display === "none" || extraInfo.style.display === "") {
    extraInfo.style.display = "block";
    moreInfoButton.textContent = "Hide Details";
  } else {
    extraInfo.style.display = "none";
    moreInfoButton.textContent = "Display More";
  }
});

// On page load
window.addEventListener("DOMContentLoaded", async () => {
  await loadModel();

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    document.getElementById("desktopUpload").style.display = "none";
    webcamSection.style.display = "none";
    document.getElementById("mobileImageOptions").style.display = "block";
  } else {
    document.getElementById("desktopUpload").style.display = "block";
    webcamSection.style.display = "block";
    document.getElementById("mobileImageOptions").style.display = "none";
  }
});
