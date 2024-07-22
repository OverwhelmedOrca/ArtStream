let web3;
let userAddress;
let nftContract;
let marketplaceContract;
let nftContractABI;
let marketplaceContractABI;

const nftContractAddress = '0x0fC5025C764cE34df352757e82f7B5c4Df39A836'; // Replace with your NFT contract address
const marketplaceContractAddress = '0xb27A31f1b0AF2946B7F582768f03239b1eC07c2c'; // Replace with your marketplace contract address

async function fetchABIs() {
  try {
    const nftABIResponse = await fetch('/nftABI');
    nftContractABI = await nftABIResponse.json();
  
    const marketplaceABIResponse = await fetch('/marketplaceABI');
    marketplaceContractABI = await marketplaceABIResponse.json();
  } catch (error) {
    console.error('Failed to fetch ABIs:', error);
  }
}

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await fetchABIs(); // Fetch ABIs before connecting

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      userAddress = accounts[0];
      document.getElementById('walletAddress').innerText = `Connected: ${userAddress}`;
      
      // Initialize contracts
      nftContract = new web3.eth.Contract(nftContractABI, nftContractAddress);
      marketplaceContract = new web3.eth.Contract(marketplaceContractABI, marketplaceContractAddress);
      
      // Load marketplace items
      loadMarketplaceItems();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  } else {
    alert('Please install MetaMask to use this dApp!');
  }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);

document.getElementById('uploadForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!userAddress) {
    alert('Please connect your wallet first!');
    return;
  }

  const name = document.getElementById('name').value;
  const description = document.getElementById('description').value;
  const price = document.getElementById('price').value;
  const file = document.getElementById('painting').files[0];

  await mintNFT(name, description, price, file);
});

async function mintNFT(name, description, price, file) {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('painting', file);
    formData.append('walletAddress', userAddress);

    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Minting result:', result);

    if (result.success) {
      alert('NFT minted and listed successfully!');
      loadMarketplaceItems();
    } else {
      throw new Error(result.message || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('Error minting NFT:', error);
    alert('Failed to mint NFT: ' + error.message);
  }
}

async function listNFTinMarketplace(tokenId, price) {
  try {
    await nftContract.methods.approve(marketplaceContractAddress, tokenId).send({ from: userAddress });
    await marketplaceContract.methods.listNFT(tokenId, price).send({ from: userAddress });
    alert('NFT listed in the marketplace successfully!');
    loadMarketplaceItems();
  } catch (error) {
    console.error('Failed to list NFT:', error);
    alert('Failed to list NFT in the marketplace');
  }
}

async function loadMarketplaceItems() {
  const marketplaceDiv = document.getElementById('marketplace');
  marketplaceDiv.innerHTML = '';
  
  const totalSupply = await nftContract.methods.totalSupply().call();
  
  for (let i = 1; i <= totalSupply; i++) {
    const listing = await marketplaceContract.methods.listings(i).call();
    if (listing.active) {
      const tokenURI = await nftContract.methods.tokenURI(i).call();
      const metadata = await fetch(tokenURI).then(res => res.json());
      
      const itemDiv = document.createElement('div');
      itemDiv.innerHTML = `
        <img src="${metadata.image}" alt="${metadata.name}" style="width:200px;">
        <h3>${metadata.name}</h3>
        <p>${metadata.description}</p>
        <p>Price: ${web3.utils.fromWei(listing.price, 'ether')} TFUEL</p>
        <button onclick="buyNFT(${i})">Buy</button>
      `;
      marketplaceDiv.appendChild(itemDiv);
    }
  }
}

async function buyNFT(tokenId) {
  if (!userAddress) {
    alert('Please connect your wallet first!');
    return;
  }
  
  try {
    const listing = await marketplaceContract.methods.listings(tokenId).call();
    await marketplaceContract.methods.buyNFT(tokenId).send({ from: userAddress, value: listing.price });
    alert('NFT purchased successfully!');
    loadMarketplaceItems();
  } catch (error) {
    console.error('Failed to buy NFT:', error);
    alert('Failed to buy NFT');
  }
}

// Call fetchABIs when the page loads
window.addEventListener('load', fetchABIs);
