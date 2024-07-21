const express = require('express');
const multer = require('multer');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const IPFS = require('ipfs-http-client');

const app = express();
const port = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

const web3 = new Web3('https://eth-rpc-api-testnet.thetatoken.org/rpc'); // Theta testnet provider
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'SimpleNFT_abi.json')));
const contractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
const contract = new web3.eth.Contract(contractABI, contractAddress);

const ipfs = IPFS.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('painting'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const ipfsUrl = await uploadToIPFS(filePath);

    const nftData = {
      name: req.body.name,
      description: req.body.description,
      image: ipfsUrl,
    };

    const account = 'YOUR_THETA_TESTNET_ACCOUNT';
    const privateKey = 'YOUR_THETA_TESTNET_PRIVATE_KEY';

    web3.eth.accounts.wallet.add(privateKey);

    const tx = await contract.methods.mint(account).send({
      from: account,
      gas: 500000,
    });

    res.status(200).send({ success: true, tx });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Failed to mint NFT' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function uploadToIPFS(filePath) {
  const file = fs.readFileSync(filePath);
  const result = await ipfs.add(file);
  return `https://ipfs.infura.io/ipfs/${result.path}`;
}
