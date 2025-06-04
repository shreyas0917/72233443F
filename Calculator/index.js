const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const TIMEOUT = 500;
const WINDOW_SIZE = 10;

let storedNumbers = [];

let token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDE1MzA1LCJpYXQiOjE3NDkwMTUwMDUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImNiZjM2OTMzLTRiNGQtNGFjYi1hZTgwLTA3ZTQ0M2YwMmFjOSIsInN1YiI6InNocmV5YXN3YW5pMDRAZ21haWwuY29tIn0sImVtYWlsIjoic2hyZXlhc3dhbmkwNEBnbWFpbC5jb20iLCJuYW1lIjoic2hyZXlhcyB3YW5pIiwicm9sbE5vIjoiNzIyMzM0NDNmIiwiYWNjZXNzQ29kZSI6IktSalVVVSIsImNsaWVudElEIjoiY2JmMzY5MzMtNGI0ZC00YWNiLWFlODAtMDdlNDQzZjAyYWM5IiwiY2xpZW50U2VjcmV0IjoiS3BqcGp6V05uS0Z6UnJjSCJ9.pLcAAykRoZZontkw9AC9VC7VVWrDZ3sfDZuPpSslCfA";

const apiUrls = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand"
};

async function getNumbers(type) {
  try {
    const response = await axios.get(apiUrls[type], {
      timeout: TIMEOUT,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      }
    });
    console.log(`Response for type '${type}':`, JSON.stringify(response.data));
    if (Array.isArray(response.data.numbers)) {
      return response.data.numbers;
    }
    return [];
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('Unauthorized or token expired - please update the token.');
      } else {
        console.error(`API error (status ${error.response.status}):`, error.response.data);
      }
    } else if (error.request) {
      console.error('No response received from API:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return [];
  }
}

function addToWindow(newNums) {
  newNums.forEach(num => {
    if (!storedNumbers.includes(num)) {
      if (storedNumbers.length >= WINDOW_SIZE) {
        storedNumbers.shift();
      }
      storedNumbers.push(num);
    }
  });
}

function calculateAverage() {
  if (storedNumbers.length === 0) return 0;
  const total = storedNumbers.reduce((sum, val) => sum + val, 0);
  return Number((total / storedNumbers.length).toFixed(2));
}

app.get('/numbers/:type', async (req, res) => {
  const type = req.params.type;
  if (!apiUrls[type]) {
    return res.status(400).json({ error: 'Invalid number type provided' });
  }

  const previousWindow = [...storedNumbers];
  const newNumbers = await getNumbers(type);
  addToWindow(newNumbers);
  const average = calculateAverage();

  res.json({
    windowPrevState: previousWindow,
    windowCurrState: [...storedNumbers],
    numbers: newNumbers,
    avg: average
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/numbers/e`);
});
