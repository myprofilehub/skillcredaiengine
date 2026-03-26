import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.models) {
            console.log("No models found or error in response:", JSON.stringify(data, null, 2));
            return;
        }

        const imageModels = data.models.filter(m => m.name.toLowerCase().includes('imagen'));
        
        if (imageModels.length === 0) {
            console.log("No Imagen-related models were found for this API key.");
            console.log("All accessible models:");
            data.models.forEach(m => console.log(` - ${m.name} (${m.displayName})`));
        } else {
            console.log("Supported Image Generation Models:");
            imageModels.forEach(m => console.log(` ✅ ${m.name} - ${m.displayName}`));
        }

    } catch (error) {
        console.error("Request failed:", error.message);
    }
}

listModels();
