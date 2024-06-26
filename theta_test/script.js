document.addEventListener('DOMContentLoaded', () => {
    const createStreamButton = document.getElementById('createStream');
    const listIngestorsButton = document.getElementById('listIngestors');
    const selectIngestorButton = document.getElementById('selectIngestor');
    const streamInfoDiv = document.getElementById('streamInfo');

    let streamId;
    let ingestorId;

    const apiBaseUrl = 'https://api.thetavideoapi.com';
    const serviceAccountId = 'srvacc_s7fdhd03ey47a3jby93vm4cae'; // Replace with your service account ID
    const serviceAccountSecret = 'c2ud7ga8k0at8pbib55vdh1wg35bdnh1'; // Replace with your service account secret

    createStreamButton.addEventListener('click', () => {
        fetch(`${apiBaseUrl}/stream`, {
            method: 'POST',
            headers: {
                'x-tva-sa-id': serviceAccountId,
                'x-tva-sa-secret': serviceAccountSecret,                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'demo' })
        })
        .then(response => response.json())
        .then(data => {
            streamId = data.body.id;
            streamInfoDiv.innerHTML = `Livestream created with ID: ${streamId}`;
        })
        .catch(error => console.error('Error:', error));
    });

    listIngestorsButton.addEventListener('click', () => {
        fetch(`${apiBaseUrl}/ingestor/filter`, {
            method: 'GET',
            headers: {
                'x-tva-sa-id': serviceAccountId,
                'x-tva-sa-secret': serviceAccountSecret
            }
        })
        .then(response => response.json())
        .then(data => {
            const ingestors = data.body.ingestors;
            ingestorId = ingestors[0].id; // Selecting the first ingestor for simplicity
            streamInfoDiv.innerHTML = `Available Edge Ingestor ID: ${ingestorId}`;
        })
        .catch(error => console.error('Error:', error));
    });

    selectIngestorButton.addEventListener('click', () => {
        if (!streamId || !ingestorId) {
            streamInfoDiv.innerHTML = 'Please create a stream and list ingestors first.';
            return;
        }

        fetch(`${apiBaseUrl}/ingestor/${ingestorId}/select`, {
            method: 'PUT',
            headers: {
                'x-tva-sa-id': serviceAccountId,
                'x-tva-sa-secret': serviceAccountSecret,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tva_stream: streamId })
        })
        .then(response => response.json())
        .then(data => {
            const { stream_server, stream_key } = data.body;
            streamInfoDiv.innerHTML = `Stream Server: ${stream_server}<br>Stream Key: ${stream_key}`;
        })
        .catch(error => console.error('Error:', error));
    });
});
