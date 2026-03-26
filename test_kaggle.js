require('dotenv').config();

async function testKaggle() {
  const url = process.env.KAGGLE_VIDEO_ENDPOINT;
  console.log("Pinging Kaggle at:", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      // Since 'prompt' is passed safely, we can't inject bash here.
      // But we can check if the user literally just gets an error because of '--num-frames 2s'.
      // We know the Kaggle server is still running the old code!
      body: JSON.stringify({ prompt: "A futuristic city", aspectRatio: "16:9" })
    });

    const data = await res.json();
    console.log("KAGGLE RESPONSE:", data);
  } catch (e) {
    console.error("Fetch Exception:", e);
  }
}

testKaggle();
