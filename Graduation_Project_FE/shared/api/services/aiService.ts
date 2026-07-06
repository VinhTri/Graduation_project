import { GoogleGenerativeAI, FunctionDeclaration, Schema, SchemaType } from '@google/generative-ai';

// Initialize the Gemini API client
const API_KEY = 'AIzaSyCgU6VlK6ZJvK4B4Bo6WoFH2iqMicrjicw'; // Replace with env variable in production
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the navigate_screen function declaration
const navigateScreenDeclaration: FunctionDeclaration = {
  name: "navigate_screen",
  description: "Navigates the user to a specific screen in the app.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      screen: {
        type: SchemaType.STRING,
        description: "The screen to navigate to. Can be 'topup' (nạp tiền), 'withdraw' (rút tiền), 'wallet' (ví), 'funds' (quỹ), 'categories' (danh mục).",
      },
      amount: {
        type: SchemaType.NUMBER,
        description: "The amount of money to deposit or withdraw, if specified by the user.",
      },
    },
    required: ["screen"],
  },
};

// Define the get_spending_report function declaration
const getSpendingReportDeclaration: FunctionDeclaration = {
  name: "get_spending_report",
  description: "Fetches the spending report for the user based on a specific timeframe. Use this when the user asks how much they spent today, this month, or which category they spent the most on.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      timeframe: {
        type: SchemaType.STRING,
        description: "The timeframe for the report. Must be one of: 'day', 'month', 'year'.",
      },
    },
    required: ["timeframe"],
  },
};

export const getGeminiChatSession = (userInfo: string, walletInfo: string) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are a helpful and smart financial assistant for the SmartSpend app. 
Here is the information about the current user:
${userInfo}

Here is the information about their wallet:
${walletInfo}

If the user asks questions about themselves or their balance, use this information to answer.
If the user wants to navigate to a screen (deposit, withdraw, wallet, funds, categories), you MUST use the 'navigate_screen' tool.
If the user asks about their spending (e.g. how much they spent today, this month, or top categories), you MUST use the 'get_spending_report' tool to fetch the data before answering.
Be concise, friendly, and speak in Vietnamese.`,
    tools: [
      {
        functionDeclarations: [navigateScreenDeclaration, getSpendingReportDeclaration],
      },
    ],
  });

  return model.startChat({
    history: [],
  });
};
