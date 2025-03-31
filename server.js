const { google } = require('@ai-sdk/google');
const { generateObject,generateText } = require('ai');
const { z } = require('zod');
const dotenv = require('dotenv');
const yahooFinance = require('yahoo-finance2').default;

dotenv.config({ path: '.env.local' });

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());



const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
const day = String(today.getDate()).padStart(2, '0');



app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Message content is required" });
  }
  const input = userMessage;
  const { object } = await generateObject({
    model: google('gemini-1.5-pro-latest'),
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    system: 'seperate question and stock names from the input.',
    schema: z.object({
      stock_name: z.array(z.string()).describe('List of stock names as named in yahoo finance. For example: ITC.NS, RELIANCE.NS, etc.'),
      question : z.string().describe('question that the user are expexting from the stock. Don\'t include the stock names.'),
      
    }),
    prompt: input,
  });
  const stock_name = object['stock_name'];
  const question = object['question'];
  console.log(stock_name);
  console.log(question);
  await delay(1000);


  
let Technical_Rating = [];
let Fundamental_Rating = [];    

(async () => {
    for (let i = 0; i < stock_name.length; i++) {
        const result = await EachStockAnalysis(stock_name[i]);
        Fundamental_Rating.push({ [stock_name[i]]: {"Rating":result['Fundamental Analysis'][0],'Explination': result['Fundamental Analysis'][1]}});
        await delay(2000); // Delay of 2 second between iterations
        Technical_Rating.push({ [stock_name[i]]: {"Rating":result['Technical Analysis'][0],'Explination': result['Technical Analysis'][1]}});
        await delay(2000); // Delay of 2 second between iterations
    }
    await delay(2000); // Delay of 2 second between iterations
    console.log(`Technical Ratings: ${JSON.stringify(Technical_Rating)}
        Fundamental Ratings: ${JSON.stringify(Fundamental_Rating)}`);
    const { text } = await generateText({
        model: google('gemini-1.5-pro'),
        apiKey: process.env.GOOGLE_API_KEY,
        system: 'You are a stock analysis agent and answer in detail only questions related to stock market, investment and related stuff. Answer based on the given analysis, or recommend whether to buy the stock in the current market condition.If the question is on general part give a professional answer. dont use ** in the outputs.',
        prompt: `Question: ${question}
        Technical Ratings: ${JSON.stringify(Technical_Rating)}
        Fundamental Ratings: ${JSON.stringify(Fundamental_Rating)}`,
    });
    const aiResponse = {
      id: Date.now(),
      content: text,
      sender: "ai",
    };
      console.log(text);
      res.json(aiResponse);
    
})();
  

});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



async function getRSI(symbol, period = 14) {
  try {
      const data = await yahooFinance.chart(symbol, { period1: `${year-1}-${month}-${day}`, interval: "1d" });
      const closePrices = data.quotes.map((q) => q.close);

      // Compute RSI
      const gains = [];
      const losses = [];
      for (let i = 1; i < closePrices.length; i++) {
          let change = closePrices[i] - closePrices[i - 1];
          gains.push(Math.max(0, change));
          losses.push(Math.max(0, -change));
      }

      let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

      for (let i = period; i < gains.length; i++) {
          avgGain = (avgGain * (period - 1) + gains[i]) / period;
          avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      }

      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      return rsi.toFixed(2);
  } catch (error) {
      console.error("Error fetching RSI:", error);
  }
}

// getRSI("RELIANCE.NS");


async function getSMA(symbol, period = 50) {
  try {
      const data = await yahooFinance.chart(symbol, { period1:`${year-1}-${month}-${day}`, interval: "1d" });
      const closePrices = data.quotes.map((q) => q.close);

      // Calculate SMA
      let sma = closePrices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
      return sma.toFixed(2);
  } catch (error) {
      console.error("Error fetching SMA:", error);
  }
}

// getSMA("RELIANCE.NS");



async function getEMA(symbol, period = 20) {
  try {
      const data = await yahooFinance.chart(symbol, {
          period1:`${year-1}-${month}-${day}`, // Start date (10 years ago)
          interval: '1d',
      });
      
      const prices = data.quotes.map(q => q.close).filter(Boolean);
      
      if (prices.length < period) {
          console.log("Not enough data to calculate EMA");
          return;
      }

      const multiplier = 2 / (period + 1);
      let ema = prices.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      
      const emaValues = [ema];
      for (let i = period; i < prices.length; i++) {
          ema = (prices[i] - ema) * multiplier + ema;
          emaValues.push(ema);
      }

      return JSON.stringify(emaValues);
  } catch (error) {
      console.error("Error fetching data:", error);
  }
}

// getEMA("ITC.NS"); // Example usage for Apple stock

async function getMACD(symbol) {
  try {
      const data = await yahooFinance.chart(symbol, { period1:`${year-10}-${month}-${day}`, interval: "1d" });

      const closePrices = data.quotes.map(quote => quote.close).filter(price => price !== null);

      function calculateEMA(prices, period) {
          let k = 2 / (period + 1);
          let emaArray = [prices[0]]; 

          for (let i = 1; i < prices.length; i++) {
              emaArray.push(prices[i] * k + emaArray[i - 1] * (1 - k));
          }
          return emaArray;
      }
      
      const ema12 = calculateEMA(closePrices, 12);
      const ema26 = calculateEMA(closePrices, 26);
      const macdLine = ema12.map((val, index) => val - ema26[index]);

      const signalLine = calculateEMA(macdLine, 9);
      const histogram = macdLine.map((val, index) => val - signalLine[index]);

      const last5Days = [];
      last5Days.push({"MACD Line": macdLine.slice(-5)});
      last5Days.push({"Signal Line": signalLine.slice(-5)});
      last5Days.push({"Histogram": histogram.slice(-5)});
      return last5Days;
  } catch (error) {
      console.error("Error fetching MACD:", error);
  }
}

// getMACD("ITC.NS");



async function getATR(symbol) {
  try {
      const data = await yahooFinance.chart(symbol, { period1:  `${year-10}-${month}-${day}`, interval: "1d" });

      const quotes = data.quotes;
      if (!quotes || quotes.length < 15) {
          console.log("Not enough data for ATR calculation.");
          return;
      }

      function calculateTR(quotes) {
          let trValues = [];
          for (let i = 1; i < quotes.length; i++) {
              let high = quotes[i].high;
              let low = quotes[i].low;
              let prevClose = quotes[i - 1].close;

              let tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
              trValues.push(tr);
          }
          return trValues;
      }

      function calculateEMA(values, period) {
          let k = 2 / (period + 1);
          let emaArray = [values[0]];

          for (let i = 1; i < values.length; i++) {
              emaArray.push(values[i] * k + emaArray[i - 1] * (1 - k));
          }
          return emaArray;
      }

      const trValues = calculateTR(quotes);
      const atrValues = calculateEMA(trValues, 14);

      return atrValues.slice(-5);
  } catch (error) {
      console.error("Error fetching ATR:", error);
  }
}

// getATR("ITC.NS"); // Example usage for ITC stock




async function getBollingerBands(symbol) {
  try {
      const data = await yahooFinance.chart(symbol, { period1: `${year-10}-${month}-${day}`, interval: "1d" });

      const quotes = data.quotes;
      if (!quotes || quotes.length < 20) {
          console.log("Not enough data for Bollinger Bands calculation.");
          return;
      }

      function calculateSMA(values, period) {
          let smaArray = [];
          for (let i = period - 1; i < values.length; i++) {
              let sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
              smaArray.push(sum / period);
          }
          return smaArray;
      }

      function calculateStandardDeviation(values, period) {
          let stdArray = [];
          for (let i = period - 1; i < values.length; i++) {
              let subset = values.slice(i - period + 1, i + 1);
              let mean = subset.reduce((a, b) => a + b, 0) / period;
              let variance = subset.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / period;
              stdArray.push(Math.sqrt(variance));
          }
          return stdArray;
      }

      const closePrices = quotes.map(q => q.close);
      const period = 20;

      const sma = calculateSMA(closePrices, period);
      const stdDev = calculateStandardDeviation(closePrices, period);

      const upperBand = sma.map((value, index) => value + 2 * stdDev[index]);
      const lowerBand = sma.map((value, index) => value - 2 * stdDev[index]);

      const last5days = []
      for (let i = sma.length - 5; i < sma.length; i++) {
          last5days.push({
              Middle: sma[i],
              Upper: upperBand[i],
              Lower: lowerBand[i],
          });
      }
      return last5days;
  } catch (error) {
      console.error("Error fetching Bollinger Bands:", error);
  }
}

// getBollingerBands("ITC.NS");


async function getWilliamsR(symbol, period = 14) {
  try {
      const data = await yahooFinance.chart(symbol, { period1: `${year}-${month-1}-${day}`, interval: "1d" });

      const quotes = data.quotes;
      if (!quotes || quotes.length < period) {
          console.log("Not enough data for Williams %R calculation.");
          return [];
      }

      function calculateWilliamsR(quotes, period) {
          let williamsRArray = [];

          for (let i = period - 1; i < quotes.length; i++) {
              let periodQuotes = quotes.slice(i - period + 1, i + 1);
              let highestHigh = Math.max(...periodQuotes.map(q => q.high));
              let lowestLow = Math.min(...periodQuotes.map(q => q.low));
              let close = quotes[i].close;

              let williamsR = ((highestHigh - close) / (highestHigh - lowestLow)) * -100;

              williamsRArray.push({ date: quotes[i].date, WilliamsR: williamsR });
          }

          return williamsRArray;
      }

      const williamsRValues = calculateWilliamsR(quotes, period);
      const last5Days = williamsRValues.slice(-5); // Get only the last 5 days
      return last5Days;

  } catch (error) {
      console.error("Error fetching Williams %R:", error);
      return [];
  }
}

// getWilliamsR("AAPL"); // Example with Apple stock



async function getIchimokuCloud(symbol) {
  const today_month = today.getMonth() + 1; // Months are 0-indexed, so add 1

  try {
      const data = await yahooFinance.chart(symbol, { period1: `${today_month >3 ? year : year-1}-${String(today_month >3 ? today_month-3: 12-3+today_month).padStart(2, '0')}-${day}`, interval: "1d" });
      const quotes = data.quotes;

      if (!quotes || quotes.length < 52) {
          console.log("Not enough data for Ichimoku Cloud calculation.");
          return [];
      }

      function calculateIchimoku(quotes) {
          let ichimokuArray = [];

          for (let i = 52; i < quotes.length; i++) {
              let period9 = quotes.slice(i - 9, i);
              let period26 = quotes.slice(i - 26, i);
              let period52 = quotes.slice(i - 52, i);

              let tenkanSen = (Math.max(...period9.map(q => q.high)) + Math.min(...period9.map(q => q.low))) / 2;
              let kijunSen = (Math.max(...period26.map(q => q.high)) + Math.min(...period26.map(q => q.low))) / 2;
              let senkouSpanA = (tenkanSen + kijunSen) / 2;
              let senkouSpanB = (Math.max(...period52.map(q => q.high)) + Math.min(...period52.map(q => q.low))) / 2;
              let chikouSpan = quotes[i - 26].close; // Close price shifted 26 periods back

              ichimokuArray.push({
                  date: quotes[i].date,
                  tenkanSen,
                  kijunSen,
                  senkouSpanA,
                  senkouSpanB,
                  chikouSpan
              });
          }

          return ichimokuArray;
      }

      const ichimokuValues = calculateIchimoku(quotes);
      const last5Days = ichimokuValues.slice(-5); // Get last 5 days

      return last5Days;
  } catch (error) {
      console.error("Error fetching Ichimoku Cloud:", error);
      return [];
  }
}

// getIchimokuCloud("ITC.NS"); // Example for Apple stock

async function getStockOverview(symbol) {
  try {
      const result = await yahooFinance.quote(symbol);
      return JSON.stringify(result);
  } catch (error) {
      console.error("Error fetching stock overview:", error);
  }
}
async function calculateIndicators(symbol) {
  return JSON.stringify({
      SMA: await getSMA(symbol),
      EMA: await getEMA(symbol),
      MACD_last5Days: await getMACD(symbol),
      RSI_last5Days: await getRSI(symbol),
      BollingerBands_last5Days: await getBollingerBands(symbol),
      ATR_last5Days: await getATR(symbol),
      WilliamsR_last5Days: await getWilliamsR(symbol),
      Ichimoku_last5Days: await getIchimokuCloud(symbol)
  });
}
// calculateIndicators("ITC.NS").then(result => console.log(result)); or use as function

async function EachStockAnalysis(symbol) {
  const Fundamental_Analysis_result = {"Fundamental Analysis Result":await getStockOverview(symbol)};
  const Technical_Analysis_result = {"Technical Analysis Result":await calculateIndicators(symbol)};

  const response = await generateObject({
      model: google('gemini-1.5-pro-latest'),
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      system: "Answer in short but with all details which means use less words but include all the details.",
      schema: z.object({
          Technical_Analysis_Rating: z.number().describe('Final rating of the stock from 1 to 10 based on the each technical analysis.'),
          Technical_Analysis_Explination: z.string().describe('a short explination of the rating of the stock from 1 to 10 based on the each technical analysis.'),
          Fundamental_Analysis_Rating: z.number().describe('Rating of the stock from 1 to 10 based on Fundamental analysis.'),
          Fundamental_Analysis_Explination: z.string().describe('a short explination of the rating of the stock from 1 to 10 based on the Fundamental analysis.'),
      }),
      prompt: `Analyze the following stock technical indicators and provide ratings from 1 to 10:

      ${JSON.stringify(Fundamental_Analysis_result, null, 2)} , ${JSON.stringify(Technical_Analysis_result, null, 2)}

      Based on these values, rate each indicator from 1 to 10 and also provide a final rating of the stock.
      `,
  });
  return {"Fundamental Analysis":[response.object.Fundamental_Analysis_Rating, response.object.Fundamental_Analysis_Explination],"Technical Analysis":[response.object.Technical_Analysis_Rating, response.object.Technical_Analysis_Explination]}; // Return both the final rating and the explanation
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
