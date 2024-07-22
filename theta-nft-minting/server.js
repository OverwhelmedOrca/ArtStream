const express = require('express');
const multer = require('multer');
const Web3 = require('web3'); // Ensure correct import
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

// Load the contract ABI and address
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'SimpleNFT_abi.json')));
const contractAddress = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B'; // Replace with your deployed contract address
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Pinata API keys
const pinataApiKey = 'e4a866872b4d5fee9f82'; // Replace with your Pinata API key
const pinataSecretApiKey = 'e91f348197beeb8014a66809004f0bb899cc1a25c2ddfff8159b10f63dbf1232'; // Replace with your Pinata secret API key

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle file upload and minting NFT
app.post('/upload', upload.single('painting'), async (req, res) => {
  try {
    // Upload the file to Pinata and get the URL
    const filePath = req.file.path;
    const pinataUrl = await uploadToPinata(filePath);

    // Replace with your Theta testnet account and private key
    const account = '0x8DC37Ac16F7cE87Cc32AEb8fb81972bF7f413d30'; // Replace this with your Theta testnet account
    const privateKey = '404e5eda7beb729566738308ff05fcd74cff195b124377ba0ac296862eea4f03'; // Replace this with your Theta testnet private key

    // Add the private key to the wallet
    web3.eth.accounts.wallet.add(privateKey);

    // Mint the NFT on the Theta testnet
    const tx = await contract.methods.mintNFT(account, pinataUrl).send({
      from: account,
      gas: 500000,
    });

    // Send the response
    res.status(200).send({ success: true, tx });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Failed to mint NFT' });
  }
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
