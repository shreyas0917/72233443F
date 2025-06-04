const express = require('express');
const axios = require('axios');

const server = express();
const SERVER_PORT = 9876;
const MAX_WINDOW_CAPACITY = 10;
const REQUEST_TIMEOUT = 500;

let slidingWindow = [];

const API_AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDE1MzA1LCJpYXQiOjE3NDkwMTUwMDUsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImNiZjM2OTMzLTRiNGQtNGFjYi1hZTgwLTA3ZTQ0M2YwMmFjOSIsInN1YiI6InNocmV5YXN3YW5pMDRAZ21haWwuY29tIn0sImVtYWlsIjoic2hyZXlhc3dhbmkwNEBnbWFpbC5jb20iLCJuYW1lIjoic2hyZXlhcyB3YW5pIiwicm9sbE5vIjoiNzIyMzM0NDNmIiwiYWNjZXNzQ29kZSI6IktSalVVVSIsImNsaWVudElEIjoiY2JmMzY5MzMtNGI0ZC00YWNiLWFlODAtMDdlNDQzZjAyYWM5IiwiY2xpZW50U2VjcmV0IjoiS3BqcGp6V05uS0Z6UnJjSCJ9.pLcAAykRoZZontkw9AC9VC7VVWrDZ3sfDZuPpSslCfA";

const serviceEndpoints = {
    p: "http://20.244.56.144/evaluation-service/primes",
    f: "http://20.244.56.144/evaluation-service/fibo",
    e: "http://20.244.56.144/evaluation-service/even",
    r: "http://20.244.56.144/evaluation-service/rand"
};

const retrieveNumbersFromAPI = async (numberType) => {
    const endpoint = serviceEndpoints[numberType];
    try {
        const apiResponse = await axios.get(endpoint, {
            timeout: REQUEST_TIMEOUT,
            headers: {
                Authorization: API_AUTH_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        return Array.isArray(apiResponse.data.numbers) ? apiResponse.data.numbers : [];
    } catch (err) {
        console.error(`Failed to retrieve ${numberType} numbers: ${err.message}`);
        return [];
    }
};

const updateSlidingWindow = (newNumbers) => {
    newNumbers.forEach(number => {
        if (!slidingWindow.includes(number)) {
            if (slidingWindow.length >= MAX_WINDOW_CAPACITY) {
                slidingWindow.shift();
            }
            slidingWindow.push(number);
        }
    });
};

const calculateWindowAverage = () => {
    if (slidingWindow.length === 0) return 0;
    const sum = slidingWindow.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / slidingWindow.length).toFixed(2));
};

server.get('/numbers/:numberType', async (req, res) => {
    const requestedType = req.params.numberType;
    const previousWindowSnapshot = [...slidingWindow];

    if (!serviceEndpoints.hasOwnProperty(requestedType)) {
        return res.status(400).json({
            error: "Invalid number type. Supported types: p (prime), f (fibonacci), e (even), r (random)"
        });
    }

    const retrievedNumbers = await retrieveNumbersFromAPI(requestedType);
    updateSlidingWindow(retrievedNumbers);
    const currentAverage = calculateWindowAverage();

    res.json({
        windowPrevState: previousWindowSnapshot,
        windowCurrState: [...slidingWindow],
        numbers: retrievedNumbers,
        avg: currentAverage
    });
});

server.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error occurred' });
});

server.listen(SERVER_PORT, () => {
    console.log(`📊 Number Window Calculator Service running on port ${SERVER_PORT}`);
    console.log(`🌐 Access at: http://localhost:${SERVER_PORT}/numbers/p`);
});
