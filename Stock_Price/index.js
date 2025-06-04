const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const BASE_URL = 'http://20.244.56.144/evaluation-service/stocks';

const getStockHistory = async (ticker, minutes) => {
  try {
    const response = await axios.get(`${BASE_URL}/${ticker}?minutes=${minutes}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    return [];
  }
};

const calculateAverage = (prices) => {
  if (!prices.length) return 0;
  const total = prices.reduce((sum, p) => sum + p.price, 0);
  return total / prices.length;
};

const calculateCorrelation = (data1, data2) => {
  const len = Math.min(data1.length, data2.length);
  if (len < 2) return 0;

  const x = data1.slice(0, len).map(p => p.price);
  const y = data2.slice(0, len).map(p => p.price);

  const meanX = x.reduce((sum, val) => sum + val, 0) / len;
  const meanY = y.reduce((sum, val) => sum + val, 0) / len;

  let numerator = 0, denomX = 0, denomY = 0;

  for (let i = 0; i < len; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? 0 : numerator / denominator;
};

app.get('/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { minutes, aggregation } = req.query;

  if (aggregation !== 'average') {
    return res.status(400).json({ error: 'Only average aggregation is supported' });
  }

  const priceHistory = await getStockHistory(ticker, minutes);
  const averageStockPrice = calculateAverage(priceHistory);

  res.json({
    averageStockPrice,
    priceHistory
  });
});

app.get('/stockcorrelation', async (req, res) => {
  const { minutes, ticker1, ticker2 } = req.query;

  if (!ticker1 || !ticker2) {
    return res.status(400).json({ error: 'Both ticker1 and ticker2 are required' });
  }

  const [data1, data2] = await Promise.all([
    getStockHistory(ticker1, minutes),
    getStockHistory(ticker2, minutes)
  ]);

  const correlation = calculateCorrelation(data1, data2);
  const avg1 = calculateAverage(data1);
  const avg2 = calculateAverage(data2);

  res.json({
    correlation,
    stocks: {
      [ticker1]: {
        averagePrice: avg1,
        priceHistory: data1
      },
      [ticker2]: {
        averagePrice: avg2,
        priceHistory: data2
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Microservice running on http://localhost:${PORT}`);
});