const web3 = new Web3(Web3.givenProvider || "https://eth-rpc-api-testnet.thetatoken.org/rpc");
const contractABI = [/* Your contract ABI here */];
const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contract = new web3.eth.Contract(contractABI, contractAddress);

document.getElementById('connectWallet').onclick = async () => {
    const accounts = await web3.eth.requestAccounts();
    window.account = accounts[0];
    document.getElementById('message').innerText = `Connected: ${window.account}`;
};

document.getElementById('mintNFT').onclick = async () => {
    const tokenURI = document.getElementById('tokenURI').value;
    try {
        await contract.methods.mintNFT(tokenURI).send({ from: window.account });
        document.getElementById('message').innerText = 'NFT Minted Successfully!';
    } catch (error) {
        console.error(error);
        document.getElementById('message').innerText = 'Error minting NFT';
    }
};
