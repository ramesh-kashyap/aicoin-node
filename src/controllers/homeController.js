const WebSocket = require('ws');
const News = require("../models/News");
const User = require("../models/User");
const Notification = require("../models/Notification");
// Predefined Binance symbols (example with 59 symbols total)
const { calculateAvailableBalance } = require("../helper/helper");
const binanceSymbols = {
  btc: 'btcusdt',
  eth: 'ethusdt',
  xrp: 'xrpusdt',
  bnb: 'bnbusdt',
  sol: 'solusdt',
  doge: 'dogeusdt',
  ada: 'adausdt',
  trx: 'trxusdt',
  avax: 'avaxusdt',
  sui: 'suiusdt',      // Adjust if needed.
  ton: 'tonusdt',      // Adjust if needed.
  link: 'linkusdt',
  shib: 'shibusdt',
  wbtc: 'wbtcusdt',
  xlm: 'xlmusdt',
  hbar: 'hbarusdt',
  dot: 'dotusdt',
  bch: 'bchusdt',
  ltc: 'ltcusdt',
  // Additional 40 symbols
  matic: 'maticusdt',
  uni: 'uniusdt',
  aave: 'aaveusdt',
  comp: 'compusdt',
  sushi: 'sushiusdt',
  crv: 'crvusdt',
  mana: 'manausdt',
  eos: 'eosusdt',
  neo: 'neousdt',
  xtz: 'xtzusdt',
  atom: 'atomusdt',
  xmr: 'xmrusdt',
  zec: 'zecusdt',
  dash: 'dashusdt',
  bat: 'batusdt',
  iota: 'iotusdt',
  vet: 'vetusdt',
  fil: 'filusdt',
  celo: 'celousdt',
  algo: 'algousdt',
  egld: 'egldusdt',
  theta: 'thetausdt',
  ftt: 'fttusdt',
  klay: 'klayusdt',
  amp: 'ampusdt',
  omg: 'omgusdt',
  icx: 'icxusdt',
  zil: 'zilusdt',
  ont: 'ontusdt',
  qtum: 'qtumusdt',
  btg: 'btgusdt',
  lrc: 'lrcusdt',
  hot: 'hotusdt',
  ren: 'renusdt',
  snx: 'snxusdt',
  bal: 'balusdt',
  kava: 'kavausdt',
  '1inch': '1inchusdt',
  celr: 'celrusdt',
  near: 'nearusdt'
};

// Build a set of allowed symbols in uppercase for quick lookup.
const allowedSymbols = new Set(
  Object.values(binanceSymbols).map(symbol => symbol.toUpperCase())
);

// Binance WebSocket URL for all market tickers
const wsUrl = 'wss://stream.binance.com:9443/ws/!ticker@arr';
const ws = new WebSocket(wsUrl);

let latestTickers = []; // Global snapshot of the latest tickers

ws.on('open', () => {
  console.log('Connected to Binance WebSocket');
});

ws.on('message', (data) => {
  try {
    // Binance sends an array of ticker objects
    const tickers = JSON.parse(data);
    latestTickers = tickers; // Update the snapshot on every message
  } catch (error) {
    console.error('Error parsing Binance WebSocket data:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('Binance WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('Binance WebSocket connection closed');
});

// Helper function to process ticker data into top gainers and losers for allowed USDT pairs only
function processTickers(tickers) {
  if (!Array.isArray(tickers)) {
    console.error('Unexpected data format from Binance WebSocket:', tickers);
    return { topGainers: [], topLosers: [], avgGainer: 0, avgLoser: 0, difference: 0, pairedDifferences: [] };
  }
  
  // Filter tickers that are in the allowedSymbols set and have a valid percentage change
  const validTickers = tickers.filter((ticker) => {
    const percent = parseFloat(ticker.P);
    return allowedSymbols.has(ticker.s) && !isNaN(percent);
  });

  // Mapping function using Binance asset icon URLs
  const mapTicker = (ticker) => {
    const percent = parseFloat(ticker.P);
    // Remove 'USDT' to get the base asset
    const baseAsset = ticker.s.replace('USDT', '');
    return {
      icon: `https://assets.coincap.io/assets/icons/${baseAsset.toLowerCase()}@2x.png`,
      name: ticker.s,
      price: parseFloat(ticker.c),
      percentage: percent,
    };
  };

  // Get top gainers: positive percentage, sorted descending
  const topGainers = validTickers
    .filter((ticker) => parseFloat(ticker.P) > 0)
    .sort((a, b) => parseFloat(b.P) - parseFloat(a.P))
    .slice(0, 4)
    .map(mapTicker);

  // Get top losers: negative percentage, sorted ascending
  const topLosers = validTickers
    .filter((ticker) => parseFloat(ticker.P) < 0)
    .sort((a, b) => parseFloat(a.P) - parseFloat(b.P))
    .slice(0, 4)
    .map(mapTicker);

  // Calculate the average percentage change for gainers and losers
  const avgGainer = topGainers.reduce((sum, coin) => sum + coin.percentage, 0) / (topGainers.length || 1);
  const avgLoser = topLosers.reduce((sum, coin) => sum + coin.percentage, 0) / (topLosers.length || 1);
  
  // Compute the overall difference (subtracting avgLoser, which is negative, adds its absolute value)
  const difference = avgGainer - avgLoser;

  // Optionally, compute paired differences (for each corresponding index)
  const pairedDifferences = topGainers.map((gainer, i) => {
    const loser = topLosers[i];
    return loser ? gainer.percentage - loser.percentage : null;
  });

  return { topGainers, topLosers, avgGainer, avgLoser, difference, pairedDifferences };
}

// HTTP GET controller returning live data and computed differences
function getLiveData(req, res) {
  const data = processTickers(latestTickers);
 
  res.json(data);
}

// Alternate function returning a Promise (if needed elsewhere)
function fetchLiveData() {
  return new Promise((resolve, reject) => {
    if (latestTickers.length === 0) {
      return reject(new Error('No data available from Binance WebSocket yet'));
    }
    const data = processTickers(latestTickers);
    resolve(data);
  });
}
  
const getAllNews = async (req, res) => {
  try {
    const userId = req.user.id; 
    const news = await News.findAll();
    const user = await User.findAll({
      where: { id: userId } // Fetch all users with id = 12 (typically returns 1)
    });
    console.log('user:',user);
    res.json({
      status: true,
      data: news,
      userData: user,
      message: 'Data Fetch Successfully'
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      status: false,
      data: null,
      message: 'Error fetching news'
    });
  }
};

const getAvailableBalance = async (req, res) => {
  try {
    // ✅ Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    const userId = req.user.id; // Authenticated User ID
    const balanceData = await calculateAvailableBalance(userId);
    

    
    res.status(200).json({
      status: true,
      message: "Balance fetched successfully",
      data:balanceData,
    });

  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ 
      status: false, 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.status(200).json({ status: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { fetchLiveData, getLiveData, getAllNews ,getAvailableBalance,getNotifications};
