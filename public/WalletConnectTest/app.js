let web3;

window.addEventListener('load', async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        document.getElementById('message').innerText = 'MetaMask is installed!';
    } else {
        document.getElementById('message').innerText = 'Please install MetaMask!';
    }
});

document.getElementById('connectWallet').onclick = async () => {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            document.getElementById('message').innerText = `Connected: ${accounts[0]}`;
        } catch (error) {
            document.getElementById('message').innerText = 'User denied account access';
        }
    } else {
        document.getElementById('message').innerText = 'Please install MetaMask!';
    }
};
