const express = require('express');
const multer = require('multer');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Correctly instantiate Web3
const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-rpc-api-testnet.thetatoken.org/rpc')); // Theta testnet provider

// Load the contract ABIs and addresses
const nftContractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'SimpleNFT_abi.json')));
const marketplaceContractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'NFTMarketplace_abi.json')));

const nftContractAddress = '0x0fC5025C764cE34df352757e82f7B5c4Df39A836'; // Replace with your deployed NFT contract address
const marketplaceContractAddress = '0xb27A31f1b0AF2946B7F582768f03239b1eC07c2c'; // Replace with your deployed marketplace contract address

const nftContract = new web3.eth.Contract(nftContractABI, nftContractAddress);
const marketplaceContract = new web3.eth.Contract(marketplaceContractABI, marketplaceContractAddress);

// Pinata API keys
const pinataApiKey = 'e4a866872b4d5fee9f82'; // Replace with your Pinata API key
const pinataSecretApiKey = 'e91f348197beeb8014a66809004f0bb899cc1a25c2ddfff8159b10f63dbf1232'; // Replace with your Pinata secret API key

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle file upload and minting NFT
app.post('/upload', upload.single('painting'), async (req, res) => {
  try {
    const { name, description, price, walletAddress } = req.body;
    const filePath = req.file.path;
    const pinataUrl = await uploadToPinata(filePath);

    // Create metadata
    const metadata = {
      name,
      description,
      image: pinataUrl
    };

    // Upload metadata to Pinata
    const metadataUrl = await uploadJSONToPinata(metadata);

    // Mint the NFT on the Theta testnet
    const mintTx = await nftContract.methods.mintNFT(walletAddress, metadataUrl, web3.utils.toWei(price, 'ether')).send({
      from: walletAddress,
      gas: 500000,
    });

    const tokenId = mintTx.events.Transfer.returnValues.tokenId;

    // Approve the marketplace contract to manage the NFT
    await nftContract.methods.approve(marketplaceContractAddress, tokenId).send({
      from: walletAddress,
      gas: 200000,
    });

    // List the NFT in the marketplace
    const listTx = await marketplaceContract.methods.listNFT(tokenId, web3.utils.toWei(price, 'ether')).send({
      from: walletAddress,
      gas: 200000,
    });

    res.status(200).send({ success: true, mintTx, listTx, tokenId });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Failed to mint and list NFT' });
  }
});

// Endpoints to serve the ABI files
app.get('/nftABI', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(path.join(__dirname, 'SimpleNFT_abi.json'))));
});

app.get('/marketplaceABI', (req, res) => {
  res.json(JSON.parse(fs.readFileSync(path.join(__dirname, 'NFTMarketplace_abi.json'))));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Function to upload a file to Pinata
async function uploadToPinata(filePath) {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  const response = await axios.post(url, formData, {
    maxContentLength: 'Infinity', // this is needed to prevent axios from erroring out with large files
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretApiKey,
    },
  });
  const ipfsHash = response.data.IpfsHash;
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
}

// Function to upload JSON metadata to Pinata
async function uploadJSONToPinata(jsonData) {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
  const response = await axios.post(url, jsonData, {
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretApiKey,
    },
  });
  const ipfsHash = response.data.IpfsHash;
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
}
