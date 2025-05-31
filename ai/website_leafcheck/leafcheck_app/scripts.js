let model, webcam, maxPredictions;
const modelURL = "model/model.json";
const metadataURL = "model/metadata.json";

let image = null;
const uploadInput = document.getElementById("upload");
const previewImage = document.getElementById("preview");
const webcamContainer = document.getElementById("webcam-container");
const webcamButton = document.getElementById("webcamButton");
const stopWebcamButton = document.getElementById("stopWebcamButton");
const predictButton = document.getElementById("predictButton");
const result = document.getElementById("result");
const confidence = document.getElementById("confidence");
const cameraSelect = document.getElementById("cameraSelect");

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
  // Add more classes as needed based on your model
};

// Load the model
async function loadModel() {
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  predictButton.disabled = false;
  console.log("Model loaded");
}

// Populate camera dropdown
async function populateCameraOptions() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );

    cameraSelect.innerHTML = "";
    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error enumerating devices:", error);
  }
}

// Stop webcam
function stopWebcam() {
  if (webcam) {
    webcam.stop();
    webcamContainer.removeChild(webcam.canvas);
    webcam = null;
    webcamButton.disabled = false;
    stopWebcamButton.disabled = true;
  }
}

// Webcam button click
webcamButton.addEventListener("click", async () => {
  if (webcam) return;

  const selectedDeviceId = cameraSelect.value;
  webcam = new tmImage.Webcam(400, 300, true);

  try {
    await webcam.setup({ deviceId: selectedDeviceId });
    await webcam.play();
  } catch (e) {
    alert("Could not access webcam: " + e.message);
    return;
  }

  window.requestAnimationFrame(loop);
  webcamContainer.appendChild(webcam.canvas);

  webcamButton.disabled = true;
  stopWebcamButton.disabled = false;
  previewImage.style.display = "none";
  image = null;
});

// Stop webcam button click
stopWebcamButton.addEventListener("click", () => {
  stopWebcam();
});

// Loop to update webcam feed
function loop() {
  if (webcam) {
    webcam.update();
    window.requestAnimationFrame(loop);
  }
}

// Handle image upload
uploadInput.addEventListener("change", (e) => {
  if (webcam) {
    stopWebcam();
  }
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    image = new Image();
    image.src = event.target.result;
    image.onload = () => {
      previewImage.src = image.src;
      previewImage.style.display = "block";
    };
  };
  reader.readAsDataURL(file);
});

// Predict button click
predictButton.addEventListener("click", async () => {
  if (!model) {
    alert("Model not loaded");
    return;
  }

  let predictionResult;

  if (webcam) {
    predictionResult = await model.predict(webcam.canvas, false);
  } else if (image) {
    predictionResult = await model.predict(image, false);
  } else {
    alert("Please upload an image or enable the webcam");
    return;
  }

  predictionResult.sort((a, b) => b.probability - a.probability);

  const best = predictionResult[0];
  result.innerText = `🌱 Detected: ${best.className}`;
  confidence.innerText = `🔍 Confidence: ${(best.probability * 100).toFixed(
    2
  )}%`;

  // Show "Display More" button
  document.getElementById("moreInfoButton").style.display = "inline-block";

  // Store detected class for later
  result.dataset.className = best.className;
});

//
document.getElementById("moreInfoButton").addEventListener("click", () => {
  const className = result.dataset.className;
  const info = diseaseInfo[className];

  if (info) {
    document.getElementById("symptoms").innerText = info.symptoms;
    document.getElementById("solutions").innerText = info.solutions;
    document.getElementById("medicines").innerText = info.medicines;
    document.getElementById("remedies").innerText = info.remedies;
    document.getElementById("extraInfo").style.display = "block";
  } else {
    alert("No additional info found for this disease.");
  }
});

// Initialize on page load
window.onload = async () => {
  await loadModel();
  await populateCameraOptions();
};
