const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Pinata API keys
const pinataApiKey = 'e4a866872b4d5fee9f82';
const pinataSecretApiKey = 'e91f348197beeb8014a66809004f0bb899cc1a25c2ddfff8159b10f63dbf1232';

app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const url = await uploadToPinata(filePath);
        fs.unlinkSync(filePath); // Delete the file after uploading
        res.json({ url });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

app.post('/upload-metadata', async (req, res) => {
    try {
        const metadata = req.body;
        const url = await uploadJSONToPinata(metadata);
        res.json({ url });
    } catch (error) {
        console.error('Error uploading metadata:', error);
        res.status(500).json({ error: 'Failed to upload metadata' });
    }
});

async function uploadToPinata(filePath) {
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(url, formData, {
        maxContentLength: 'Infinity',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey,
        },
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}

async function uploadJSONToPinata(jsonData) {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const response = await axios.post(url, jsonData, {
        headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey,
        },
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});