const express = require('express');
const multer = require('multer');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const IPFS = require('ipfs-http-client');

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

// Configure Web3 to connect to the Theta testnet
const web3 = new Web3('https://eth-rpc-api-testnet.thetatoken.org/rpc'); // Theta testnet provider

// Load the contract ABI and address
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'SimpleNFT_abi.json')));
const contractAddress = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B'; // Replace with your deployed contract address
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Configure IPFS client
const ipfs = IPFS.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle file upload and minting NFT
app.post('/upload', upload.single('painting'), async (req, res) => {
  try {
    // Upload the file to IPFS and get the URL
    const filePath = req.file.path;
    const ipfsUrl = await uploadToIPFS(filePath);

    // Replace with your Theta testnet account and private key
    const account = '0x8DC37Ac16F7cE87Cc32AEb8fb81972bF7f413d30'; // Replace this with your Theta testnet account
    const privateKey = '404e5eda7beb729566738308ff05fcd74cff195b124377ba0ac296862eea4f03'; // Replace this with your Theta testnet private key

    // Add the private key to the wallet
    web3.eth.accounts.wallet.add(privateKey);

    // Mint the NFT on the Theta testnet
    const tx = await contract.methods.mintNFT(account, ipfsUrl).send({
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

// Function to upload a file to IPFS
async function uploadToIPFS(filePath) {
  const file = fs.readFileSync(filePath);
  const result = await ipfs.add(file);
  return `https://ipfs.infura.io/ipfs/${result.path}`;
}
