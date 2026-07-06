const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const API_KEY = 'AIzaSyCgU6VlK6ZJvK4B4Bo6WoFH2iqMicrjicw';
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log(result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
